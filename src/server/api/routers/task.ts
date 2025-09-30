import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient, type TaskFrequency } from "@prisma/client";

import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
  tenantProcedure,
} from "~/server/api/trpc";

// Task input validation schemas
const createTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  description: z.string().optional(),
  propertyId: z.string(),
  roomId: z.string().optional(),
  frequency: z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]),
  intervalDays: z.number().int().positive().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  priority: z.number().int().min(1).max(5).default(1),
  assignToAll: z.boolean().default(false),
  useRotation: z.boolean().default(false),
  maxAssignments: z.number().int().positive().optional(),
  userIds: z.array(z.string()).optional(),
  userOrder: z.array(z.string()).optional(), // For assignToAll tasks - custom rotation order
  startDate: z.date(),
  dueDate: z.date(),
});

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  roomId: z.string().optional(),
  frequency: z
    .enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"])
    .optional(),
  intervalDays: z.number().int().positive().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  assignToAll: z.boolean().optional(),
  useRotation: z.boolean().optional(),
  maxAssignments: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

const updateTaskAssignmentsSchema = z.object({
  taskId: z.string(),
  userIds: z.array(z.string()),
});

const reorderRotationSchema = z.object({
  taskId: z.string(),
  userIds: z.array(z.string()).min(1), // full desired order
});

export const taskRouter = createTRPCRouter({
  // Get all tasks (admin)
  getAll: adminProcedure.query(async ({ ctx }) => {
    // Check for all overdue tasks and rotate them if needed
    await checkAndRotateOverdueTasks(ctx);

    const tasks = await ctx.db.task.findMany({
      include: {
        property: true,
        room: true,
        assignments: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            completions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks;
  }),

  // Get tasks by property
  getByProperty: adminProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check for overdue tasks in this property
      await checkAndRotateOverdueTasks(ctx);

      const tasks = await ctx.db.task.findMany({
        where: { propertyId: input.propertyId },
        include: {
          property: true,
          room: true,
          assignments: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              assignments: true,
              completions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return tasks;
    }),

  // Get tasks by room
  getByRoom: adminProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check for overdue tasks in this room
      await checkAndRotateOverdueTasks(ctx);

      const tasks = await ctx.db.task.findMany({
        where: { roomId: input.roomId },
        include: {
          property: true,
          room: true,
          assignments: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              assignments: true,
              completions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return tasks;
    }),

  // Get tasks assigned to a tenant
  getByTenant: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.user.id;

      // Check for overdue tasks and rotate them if needed
      await checkAndRotateOverdueTasks(ctx, userId);

      const taskAssignments = await ctx.db.taskAssignment.findMany({
        where: {
          userId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        include: {
          task: {
            include: {
              property: true,
              room: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
      });

      return taskAssignments;
    }),

  // Get my tasks (tenant)
  getMyTasks: tenantProcedure.query(async ({ ctx }) => {
    // Check for overdue tasks and rotate them if needed
    await checkAndRotateOverdueTasks(ctx, ctx.session.user.id);

    const taskAssignments = await ctx.db.taskAssignment.findMany({
      where: {
        userId: ctx.session.user.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        task: {
          include: {
            property: true,
            room: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return taskAssignments;
  }),

  // Get my upcoming tasks (tenant) - tasks that are not currently assigned to me
  // but I'm eligible for via assign-to-all or rotation, with their next due date
  getMyUpcomingTasks: tenantProcedure.query(async ({ ctx }) => {
    // Find tenant profiles for the current user to match property/room
    const profiles = await ctx.db.tenantProfile.findMany({
      where: { userId: ctx.session.user.id },
      select: { propertyId: true, roomId: true },
    });

    // If no tenant profile, nothing to show
    if (profiles.length === 0) return [] as const;

    // Build OR clauses for assignToAll tasks matching tenant locations
    const locationClauses = profiles.map((p) => ({
      propertyId: p.propertyId,
      ...(p.roomId ? { roomId: p.roomId } : {}),
    }));

    const tasks = await ctx.db.task.findMany({
      where: {
        isActive: true,
        frequency: { not: "ONCE" },
        OR: [
          // Assign to all tenants at the tenant's property/room
          {
            assignToAll: true,
            OR: locationClauses,
          },
          // Rotation tasks that include this user in rotation history
          {
            useRotation: true,
            assignments: { some: { userId: ctx.session.user.id } },
          },
        ],
      },
      include: {
        property: true,
        room: true,
        recurrences: {
          where: { isActive: true },
          orderBy: { nextDueDate: "asc" },
          take: 1,
        },
        assignments: {
          where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
          select: { userId: true, status: true, dueDate: true },
          orderBy: { dueDate: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Helpers for ET time and cycle math
    const nowET = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Toronto" }),
    );
    const dayDiff = (from: Date, to: Date) => {
      const ms = to.getTime() - from.getTime();
      return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    };
    const cycleDaysFor = (frequency: string, intervalDays?: number | null) => {
      switch (frequency) {
        case "DAILY":
          return 1;
        case "WEEKLY":
          return 7;
        case "MONTHLY":
          return 30; // approximation for display
        case "CUSTOM":
          return intervalDays && intervalDays > 0 ? intervalDays : 7;
        default:
          return 7;
      }
    };

    // Compute daysUntilMyTurn where possible
    const upcoming = [] as Array<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      property: { id: string; name: string };
      room: { id: string; name: string } | null;
      nextDueDate: Date | null;
      currentlyAssignedToSomeoneElse: boolean;
      daysUntilMyTurn: number | null;
    }>;

    for (const t of tasks) {
      // Skip if already assigned to me
      if (
        t.assignments.length > 0 &&
        t.assignments[0]?.userId === ctx.session.user.id
      ) {
        continue;
      }

      // Build eligible users list depending on rotation strategy
      let eligibleUsers: { userId: string }[] = [];
      if (t.assignToAll || t.useRotation) {
        eligibleUsers = await getTaskRotationOrder(ctx.db, t.id, {
          assignToAll: t.assignToAll,
          propertyId: t.propertyId,
          roomId: t.roomId,
        });
      }

      let daysUntilMyTurn: number | null = null;
      const myIndex = eligibleUsers.findIndex(
        (u) => u.userId === ctx.session.user.id,
      );
      if (myIndex !== -1) {
        const currentUserId = t.assignments[0]?.userId ?? null;
        const currentIndex = currentUserId
          ? eligibleUsers.findIndex((u) => u.userId === currentUserId)
          : -1;

        const cycleDays = cycleDaysFor(t.frequency, t.intervalDays);
        const nextDueRaw = t.recurrences[0]?.nextDueDate ?? null;
        const nextDueET = nextDueRaw
          ? new Date(
              new Date(nextDueRaw).toLocaleString("en-US", {
                timeZone: "America/Toronto",
              }),
            )
          : null;

        const stepsAhead =
          currentIndex === -1
            ? myIndex
            : (myIndex - currentIndex + eligibleUsers.length) %
              eligibleUsers.length;

        const baseDays = nextDueET ? dayDiff(nowET, nextDueET) : 0;
        daysUntilMyTurn = baseDays + stepsAhead * cycleDays;
      }

      if (daysUntilMyTurn !== null && daysUntilMyTurn <= 7) {
        upcoming.push({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          property: t.property,
          room: t.room,
          nextDueDate: t.recurrences[0]?.nextDueDate ?? null,
          currentlyAssignedToSomeoneElse:
            t.assignments.length > 0 &&
            t.assignments[0]?.userId !== ctx.session.user.id,
          daysUntilMyTurn,
        });
      }
    }

    return upcoming;
  }),

  // Get task by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // First check if this specific task has any overdue assignments
      await checkAndRotateOverdueTasks(ctx);

      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: {
          property: true,
          room: true,
          createdBy: true,
          assignments: {
            include: {
              user: true,
              completions: {
                include: {
                  user: true,
                  verifier: true,
                },
                orderBy: { completedAt: "desc" },
              },
            },
            orderBy: { dueDate: "asc" },
          },
          recurrences: {
            orderBy: { nextDueDate: "asc" },
          },
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      return task;
    }),

  // Create a task
  create: adminProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { userIds, userOrder, dueDate, startDate, ...taskData } = input;
      console.log(startDate);
      // startDate and dueDate are extracted to exclude them from taskData
      // These fields are used for assignments but not stored in the task itself

      // Sanitize optional roomId: treat empty strings as undefined
      const sanitizedRoomId =
        taskData.roomId && taskData.roomId.trim().length > 0
          ? taskData.roomId
          : undefined;

      // If a roomId is provided, validate it exists and belongs to the same property
      if (sanitizedRoomId) {
        const room = await ctx.db.room.findUnique({
          where: { id: sanitizedRoomId },
          select: { id: true, propertyId: true },
        });

        if (!room) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid roomId provided.",
          });
        }

        if (room.propertyId !== taskData.propertyId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "roomId does not belong to the specified property.",
          });
        }
      }

      // Create the task
      const task = await ctx.db.task.create({
        data: {
          ...taskData,
          roomId: sanitizedRoomId,
          createdById: ctx.session.user.id,
        },
      });

      // Create task assignments based on input
      if (userIds && userIds.length > 0) {
        if (taskData.useRotation) {
          // For rotation tasks, only assign to the first user initially
          await ctx.db.taskAssignment.create({
            data: {
              taskId: task.id,
              userId: userIds[0] ?? "",
              assignedById: ctx.session.user.id,
              dueDate,
            },
          });

          // Create TaskUserOrder records for rotation order
          await Promise.all(
            userIds.map(async (userId, index) => {
              await ctx.db.taskUserOrder.create({
                data: {
                  taskId: task.id,
                  userId: userId ?? "",
                  order: index,
                },
              });
            }),
          );
        } else {
          // For non-rotation tasks, assign to all selected users
          await Promise.all(
            userIds.map(async (userId) => {
              await ctx.db.taskAssignment.create({
                data: {
                  taskId: task.id,
                  userId: userId ?? "",
                  assignedById: ctx.session.user.id,
                  dueDate,
                },
              });
            }),
          );
        }
      } else if (taskData.assignToAll) {
        // Assign to all tenants of the property
        const tenants = await ctx.db.tenantProfile.findMany({
          where: {
            propertyId: taskData.propertyId,
            ...(taskData.roomId ? { roomId: taskData.roomId } : {}),
          },
          select: { userId: true },
          orderBy: { createdAt: "asc" },
        });

        if (tenants.length > 0) {
          // Use custom order if provided, otherwise use tenant creation order
          const orderedUserIds =
            userOrder && userOrder.length > 0
              ? userOrder
              : tenants.map((t) => t.userId);

          // Assign to the first user in the order
          await ctx.db.taskAssignment.create({
            data: {
              taskId: task.id,
              userId: orderedUserIds[0]!,
              assignedById: ctx.session.user.id,
              dueDate,
            },
          });

          // Create TaskUserOrder records with the specified order
          await Promise.all(
            orderedUserIds.map(async (userId, index) => {
              await ctx.db.taskUserOrder.create({
                data: {
                  taskId: task.id,
                  userId,
                  order: index,
                },
              });
            }),
          );
        }
      }

      // Set up recurrence if needed
      if (task.frequency !== "ONCE") {
        await ctx.db.taskRecurrence.create({
          data: {
            taskId: task.id,
            baseTaskId: task.id,
            nextDueDate: calculateNextDueDate(
              task.frequency,
              dueDate,
              task.intervalDays,
            ),
            isActive: true,
          },
        });
      }

      return task;
    }),

  // Update a task
  update: adminProcedure
    .input(updateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get the current task to check for rotation changes
      const currentTask = await ctx.db.task.findUnique({
        where: { id },
        select: { assignToAll: true, useRotation: true },
      });

      if (!currentTask) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Check if rotation settings are changing
      const turningOnRotation =
        (updateData.assignToAll === true && !currentTask.assignToAll) ||
        (updateData.useRotation === true && !currentTask.useRotation);

      const turningOffRotation =
        (updateData.assignToAll === false && currentTask.assignToAll) ||
        (updateData.useRotation === false && currentTask.useRotation);

      // Update the task
      const task = await ctx.db.task.update({
        where: { id },
        data: updateData,
        include: {
          property: true,
          room: true,
          assignments: {
            select: { id: true, userId: true, status: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // If turning on rotation, adjust assignments if needed
      if (turningOnRotation && task.assignments.length > 1) {
        // Get active assignments (PENDING or IN_PROGRESS)
        const activeAssignments = task.assignments.filter(
          (a) => a.status === "PENDING" || a.status === "IN_PROGRESS",
        );

        if (activeAssignments.length > 1) {
          // Keep only the first active assignment and delete the rest
          const otherActiveAssignments = activeAssignments.slice(1);

          // Delete other active assignments
          await ctx.db.taskAssignment.deleteMany({
            where: {
              id: {
                in: otherActiveAssignments.map((a) => a.id),
              },
            },
          });

          // Create TaskUserOrder records for all users in the task
          const allUserIds = task.assignments.map((a) => a.userId);
          await Promise.all(
            allUserIds.map(async (userId, index) => {
              await ctx.db.taskUserOrder.create({
                data: {
                  taskId: id,
                  userId,
                  order: index,
                },
              });
            }),
          );
        }
      }

      // If turning off rotation, we might need to activate SKIPPED assignments
      if (turningOffRotation) {
        // Find any SKIPPED assignments
        const skippedAssignments = task.assignments.filter(
          (a) => a.status === "SKIPPED",
        );

        // Update them to PENDING if they exist
        if (skippedAssignments.length > 0) {
          await Promise.all(
            skippedAssignments.map(async (assignment) => {
              await ctx.db.taskAssignment.update({
                where: { id: assignment.id },
                data: { status: "PENDING" },
              });
            }),
          );
        }

        // Clean up TaskUserOrder records when turning off rotation
        await ctx.db.taskUserOrder.deleteMany({
          where: { taskId: id },
        });
      }

      return task;
    }),

  // Update task assignments
  updateAssignments: adminProcedure
    .input(updateTaskAssignmentsSchema)
    .mutation(async ({ ctx, input }) => {
      const { taskId, userIds } = input;

      // Get the task
      const task = await ctx.db.task.findUnique({
        where: { id: taskId },
        include: {
          assignments: {
            select: { userId: true },
          },
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Get current assigned userIds
      const currentUserIds = task.assignments.map((a) => a.userId);

      // Find userIds to add and remove
      const userIdsToAdd = userIds.filter((id) => !currentUserIds.includes(id));
      const userIdsToRemove = currentUserIds.filter(
        (id) => !userIds.includes(id),
      );

      // Start a transaction
      await ctx.db.$transaction(async (tx) => {
        // Remove assignments and user order for users no longer assigned
        if (userIdsToRemove.length > 0) {
          await tx.taskAssignment.deleteMany({
            where: {
              taskId,
              userId: { in: userIdsToRemove },
            },
          });
          await tx.taskUserOrder.deleteMany({
            where: {
              taskId,
              userId: { in: userIdsToRemove },
            },
          });
        }

        // Add new assignments
        if (userIdsToAdd.length > 0) {
          // Check if task uses rotation
          if (task.useRotation) {
            // For rotation tasks, we need to:
            // 1. Find any active assignments (PENDING or IN_PROGRESS)
            // 2. If none exist, assign to the first user
            // 3. Create TaskUserOrder records for rotation order

            // First, check if there are any active assignments
            const activeAssignments = await tx.taskAssignment.findMany({
              where: {
                taskId,
                status: { in: ["PENDING", "IN_PROGRESS"] },
              },
              select: { id: true },
            });

            if (activeAssignments.length === 0) {
              // No active assignments, assign to first user
              const firstUserId = userIdsToAdd[0];
              if (firstUserId) {
                await tx.taskAssignment.create({
                  data: {
                    taskId,
                    userId: firstUserId,
                    assignedById: ctx.session.user.id,
                    dueDate: new Date(), // Default to today
                  },
                });
              }
            }

            // Create TaskUserOrder records for all new users
            await Promise.all(
              userIdsToAdd.map(async (userId, index) => {
                await tx.taskUserOrder.create({
                  data: {
                    taskId,
                    userId,
                    order: index,
                  },
                });
              }),
            );
          } else {
            // For non-rotation tasks, assign to all selected users
            await Promise.all(
              userIdsToAdd.map(async (userId) => {
                await tx.taskAssignment.create({
                  data: {
                    taskId,
                    userId,
                    assignedById: ctx.session.user.id,
                    dueDate: new Date(), // Default to today
                  },
                });
              }),
            );
          }
        }
      });

      return { success: true };
    }),

  // Reorder rotation for a task (admin)
  reorderRotation: adminProcedure
    .input(reorderRotationSchema)
    .mutation(async ({ ctx, input }) => {
      const { taskId, userIds } = input;

      // Ensure task exists and uses rotation or assignToAll
      const task = await ctx.db.task.findUnique({
        where: { id: taskId },
        select: { id: true, useRotation: true, assignToAll: true },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      if (!task.useRotation && !task.assignToAll) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Task does not use rotation or assign to all",
        });
      }

      await ctx.db.$transaction(async (tx) => {
        // Delete all existing user order records for this task
        await tx.taskUserOrder.deleteMany({
          where: { taskId },
        });

        // Create new user order records in the desired order
        for (let i = 0; i < userIds.length; i++) {
          const uid = userIds[i]!;

          await tx.taskUserOrder.create({
            data: {
              taskId,
              userId: uid,
              order: i,
            },
          });
        }
      });

      return { success: true };
    }),

  // Get available tenants for order selection (for assignToAll tasks)
  getAvailableTenants: adminProcedure
    .input(z.object({ propertyId: z.string(), roomId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const tenants = await ctx.db.tenantProfile.findMany({
        where: {
          propertyId: input.propertyId,
          ...(input.roomId ? { roomId: input.roomId } : {}),
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return tenants.map((tenant) => ({
        userId: tenant.userId,
        user: tenant.user,
      }));
    }),

  // Get rotation order from TaskUserOrder table
  getRotationOrder: adminProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get task info to determine if it's assignToAll
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
        select: { assignToAll: true, propertyId: true, roomId: true },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Check if we have custom rotation order
      const customOrder = await ctx.db.taskUserOrder.findMany({
        where: { taskId: input.taskId },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { order: "asc" },
      });

      if (customOrder.length > 0) {
        // Use custom order
        return customOrder.map((item) => ({
          order: item.order,
          userId: item.userId,
          user: item.user,
        }));
      }

      // Fall back to default order based on task type
      let history: Array<{
        userId: string;
        user: { id: string; name: string | null; image: string | null };
      }>;

      if (task.assignToAll) {
        // For assignToAll tasks, get all tenants in the property/room
        const tenants = await ctx.db.tenantProfile.findMany({
          where: {
            propertyId: task.propertyId,
            ...(task.roomId ? { roomId: task.roomId } : {}),
          },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        });

        history = tenants.map((tenant) => ({
          userId: tenant.userId,
          user: tenant.user,
        }));
      } else {
        // For useRotation tasks, get assignment history
        const assignments = await ctx.db.taskAssignment.findMany({
          where: { taskId: input.taskId },
          select: {
            userId: true,
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
          distinct: ["userId"],
        });

        history = assignments.map((assignment) => ({
          userId: assignment.userId,
          user: assignment.user,
        }));
      }

      return history.map((h, index) => ({
        order: index,
        userId: h.userId,
        user: h.user,
      }));
    }),

  // Delete a task
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Delete all related records
      await ctx.db.$transaction([
        ctx.db.taskCompletion.deleteMany({
          where: { taskId: input.id },
        }),
        ctx.db.taskAssignment.deleteMany({
          where: { taskId: input.id },
        }),
        ctx.db.taskRecurrence.deleteMany({
          where: { taskId: input.id },
        }),
        ctx.db.taskUserOrder.deleteMany({
          where: { taskId: input.id },
        }),
        ctx.db.task.delete({
          where: { id: input.id },
        }),
      ]);

      return { success: true };
    }),

  // Complete a task
  completeTask: protectedProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        completionNotes: z.string().optional(),
        photos: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Use a transaction to prevent race conditions
      return await ctx.db.$transaction(async (tx) => {
        // Get the assignment and lock it (Prisma transactions provide isolation)
        const assignment = await tx.taskAssignment.findUnique({
          where: { id: input.assignmentId },
          include: {
            task: true,
            // Check if this task already has a completion record
            completions: {
              where: {
                status: "COMPLETED",
                userId: ctx.session.user.id,
              },
              take: 1,
            },
          },
        });

        if (!assignment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task assignment not found",
          });
        }

        // Check if user is assigned to this task
        if (
          assignment.userId !== ctx.session.user.id &&
          ctx.session.user.role !== "ADMIN"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not assigned to this task",
          });
        }

        // Check if the task is already completed by this user
        if (assignment.status === "COMPLETED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This task is already marked as completed",
          });
        }

        // Check if there's already a completion record for this assignment
        if (assignment.completions && assignment.completions.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already completed this task",
          });
        }

        // Create completion record
        const completion = await tx.taskCompletion.create({
          data: {
            taskId: assignment.taskId,
            assignmentId: assignment.id,
            userId: ctx.session.user.id,
            completedAt: new Date(),
            completionNotes: input.completionNotes,
            photos: input.photos ?? [],
          },
        });

        // Update assignment status
        await tx.taskAssignment.update({
          where: { id: assignment.id },
          data: { status: "COMPLETED" },
        });

        // Handle recurrence if needed
        if (
          assignment.task.frequency !== "ONCE" &&
          (assignment.task.assignToAll ||
            assignment.task.useRotation ||
            assignment.task.frequency === "CUSTOM")
        ) {
          // Get the recurrence record
          const recurrence = await tx.taskRecurrence.findFirst({
            where: {
              taskId: assignment.taskId,
              isActive: true,
            },
          });

          if (recurrence) {
            // Calculate the next due date
            const nextDueDate = calculateNextDueDate(
              assignment.task.frequency,
              assignment.dueDate,
              assignment.task.intervalDays,
            );

            // Update the recurrence record
            await tx.taskRecurrence.update({
              where: { id: recurrence.id },
              data: { nextDueDate },
            });

            // Handle rotation for all tenants or specific tenants
            if (assignment.task.assignToAll || assignment.task.useRotation) {
              // Get eligible users using the helper function
              const eligibleUsers = await getTaskRotationOrder(
                tx,
                assignment.task.id,
                {
                  assignToAll: assignment.task.assignToAll,
                  propertyId: assignment.task.propertyId,
                  roomId: assignment.task.roomId,
                },
              );

              if (eligibleUsers.length > 0) {
                // Find the current user's index
                const currentIndex = eligibleUsers.findIndex(
                  (u) => u.userId === assignment.userId,
                );

                // If the current user wasn't found in the eligible users list
                // (which could happen if they were removed from the rotation),
                // default to the first user
                const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

                // Get the next user in rotation (or wrap around to the first)
                const nextIndex = (effectiveIndex + 1) % eligibleUsers.length;
                const nextUserId = eligibleUsers[nextIndex]?.userId;

                if (nextUserId) {
                  // First, check if there are any active assignments for this task
                  const activeAssignments = await tx.taskAssignment.findMany({
                    where: {
                      taskId: assignment.taskId,
                      status: { in: ["PENDING", "IN_PROGRESS"] },
                    },
                  });

                  // Only create a new assignment if there are no active ones
                  if (activeAssignments.length === 0) {
                    // Create a new assignment for the next user
                    await tx.taskAssignment.create({
                      data: {
                        taskId: assignment.taskId,
                        userId: nextUserId,
                        assignedById: ctx.session.user.id,
                        dueDate: nextDueDate,
                        recurrenceId: recurrence.id,
                      },
                    });
                  }
                } else {
                  // This shouldn't happen with our current logic, but just in case
                  console.error(
                    "No next user found for rotation task",
                    assignment.taskId,
                  );
                }
              }
            }
          }
        }

        return completion;
      });
    }),

  // Verify a task completion (admin only)
  verifyCompletion: adminProcedure
    .input(
      z.object({
        completionId: z.string(),
        status: z.enum(["COMPLETED", "SKIPPED"]).default("COMPLETED"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedCompletion = await ctx.db.taskCompletion.update({
        where: { id: input.completionId },
        data: {
          status: input.status,
          verifiedBy: ctx.session.user.id,
          verifiedAt: new Date(),
        },
      });

      return updatedCompletion;
    }),

  // Get task statistics
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalTasks,
      activeTasks,
      pendingAssignments,
      completedAssignments,
      overdueAssignments,
    ] = await Promise.all([
      ctx.db.task.count(),
      ctx.db.task.count({ where: { isActive: true } }),
      ctx.db.taskAssignment.count({ where: { status: "PENDING" } }),
      ctx.db.taskAssignment.count({ where: { status: "COMPLETED" } }),
      ctx.db.taskAssignment.count({
        where: {
          status: "PENDING",
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      totalTasks,
      activeTasks,
      pendingAssignments,
      completedAssignments,
      overdueAssignments,
    };
  }),
});

// Helper function to check and rotate overdue tasks
async function checkAndRotateOverdueTasks(
  ctx: { db: PrismaClient; session: { user: { id: string } } },
  userId?: string,
) {
  // Create a date object with Canadian Eastern Time as the standard
  const now = new Date();

  // Convert to Canadian Eastern Time (ET)
  // This creates a date string in ET, then parses it back to a Date object
  const nowET = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Toronto" }),
  );

  // Find all overdue task assignments
  const overdueAssignments = await ctx.db.taskAssignment.findMany({
    where: {
      dueDate: { lt: nowET },
      status: { in: ["PENDING", "IN_PROGRESS"] },
      ...(userId ? { userId } : {}),
      task: {
        // Only consider tasks with rotation enabled
        OR: [{ assignToAll: true }, { useRotation: true }],
        // And not one-time tasks
        frequency: { not: "ONCE" },
      },
    },
    include: {
      task: true,
      user: true,
      // Include completions to check if we've already processed this task
      completions: {
        where: {
          status: "OVERDUE",
          completedAt: {
            // Check for completions created in the last hour to prevent duplicates
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
        select: { id: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Track processed assignments to avoid duplicates
  const processedAssignments = new Set<string>();

  // Process each overdue assignment
  for (const assignment of overdueAssignments) {
    // Skip if we've already processed this assignment in this function call
    if (processedAssignments.has(assignment.id)) {
      continue;
    }

    // Skip if this assignment already has a recent OVERDUE completion record
    if (assignment.completions && assignment.completions.length > 0) {
      continue;
    }

    // Use a transaction to ensure atomicity and prevent race conditions
    await ctx.db.$transaction(async (tx) => {
      // Lock this assignment by re-fetching with a FOR UPDATE lock (Prisma doesn't directly support FOR UPDATE,
      // but the transaction provides isolation)
      const lockedAssignment = await tx.taskAssignment.findUnique({
        where: { id: assignment.id },
        include: {
          task: true,
          completions: {
            where: { status: "OVERDUE" },
            orderBy: { completedAt: "desc" },
            take: 1,
          },
        },
      });

      // Double-check the status hasn't changed and no completion record exists
      if (
        !lockedAssignment ||
        !["PENDING", "IN_PROGRESS"].includes(lockedAssignment.status) ||
        (lockedAssignment.completions &&
          lockedAssignment.completions.length > 0)
      ) {
        return; // Skip this assignment
      }

      // Get the recurrence record
      const recurrence = await tx.taskRecurrence.findFirst({
        where: {
          taskId: assignment.taskId,
          isActive: true,
        },
      });

      if (!recurrence) {
        return; // Skip if no recurrence record
      }

      // Calculate the next due date
      const nextDueDate = calculateNextDueDate(
        assignment.task.frequency,
        assignment.dueDate,
        assignment.task.intervalDays,
      );

      // Update the recurrence record
      await tx.taskRecurrence.update({
        where: { id: recurrence.id },
        data: { nextDueDate },
      });

      // Mark the current assignment as OVERDUE
      await tx.taskAssignment.update({
        where: { id: assignment.id },
        data: { status: "OVERDUE" },
      });

      // Create a record of the overdue task for tracking purposes
      await tx.taskCompletion.create({
        data: {
          assignmentId: assignment.id,
          taskId: assignment.taskId,
          userId: assignment.userId,
          status: "OVERDUE",
          completedAt: new Date(),
          completionNotes: "Task automatically marked as overdue by system",
        },
      });

      // Handle rotation
      if (assignment.task.assignToAll || assignment.task.useRotation) {
        // Get eligible users using the helper function
        const eligibleUsers = await getTaskRotationOrder(
          tx,
          assignment.task.id,
          {
            assignToAll: assignment.task.assignToAll,
            propertyId: assignment.task.propertyId,
            roomId: assignment.task.roomId,
          },
        );

        if (eligibleUsers.length > 0) {
          // Find the current user's index
          const currentIndex = eligibleUsers.findIndex(
            (u) => u.userId === assignment.userId,
          );

          // If the current user wasn't found, default to the first user
          const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

          // Get the next user in rotation
          const nextIndex = (effectiveIndex + 1) % eligibleUsers.length;
          const nextUserId = eligibleUsers[nextIndex]?.userId;

          if (nextUserId) {
            // Check for any active assignments
            const activeAssignments = await tx.taskAssignment.findMany({
              where: {
                taskId: assignment.taskId,
                status: { in: ["PENDING", "IN_PROGRESS"] },
              },
            });

            // Only create a new assignment if there are no active ones
            if (activeAssignments.length === 0) {
              // Create a new assignment for the next user
              await tx.taskAssignment.create({
                data: {
                  taskId: assignment.taskId,
                  userId: nextUserId,
                  assignedById: ctx.session.user.id,
                  dueDate: nextDueDate,
                  recurrenceId: recurrence.id,
                },
              });
            }
          }
        }
      }

      // Mark as processed to avoid duplicate processing
      processedAssignments.add(assignment.id);
    });
  }

  return overdueAssignments.length > 0; // Return true if any tasks were rotated
}

// Helper function to get rotation order for a task
async function getTaskRotationOrder(
  db:
    | PrismaClient
    | Omit<
        PrismaClient,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
      >,
  taskId: string,
  task: { assignToAll: boolean; propertyId: string; roomId: string | null },
): Promise<{ userId: string }[]> {
  // Check if we have custom rotation order
  const customOrder = await db.taskUserOrder.findMany({
    where: { taskId },
    select: { userId: true },
    orderBy: { order: "asc" },
  });

  if (customOrder.length > 0) {
    return customOrder;
  }

  // Fall back to default order based on task type
  if (task.assignToAll) {
    // For assignToAll tasks, get all tenants in the property/room
    const tenants = await db.tenantProfile.findMany({
      where: {
        propertyId: task.propertyId,
        ...(task.roomId ? { roomId: task.roomId } : {}),
      },
      select: { userId: true },
      orderBy: { createdAt: "asc" },
    });
    return tenants;
  } else {
    // For useRotation tasks, get assignment history
    const assignments = await db.taskAssignment.findMany({
      where: { taskId },
      select: { userId: true },
      orderBy: { createdAt: "asc" },
      distinct: ["userId"],
    });
    return assignments;
  }
}

// Helper function to calculate the next due date based on frequency
function calculateNextDueDate(
  frequency: TaskFrequency,
  currentDueDate: Date,
  intervalDays?: number | null,
): Date {
  // Convert to Canadian Eastern Time
  const currentDateStr = new Date(currentDueDate).toLocaleString("en-US", {
    timeZone: "America/Toronto",
  });
  const currentET = new Date(currentDateStr);

  // Create a new date object for the next due date (in ET)
  const nextDueDate = new Date(currentET);

  switch (frequency) {
    case "DAILY":
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;
    case "WEEKLY":
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case "MONTHLY":
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
    case "CUSTOM":
      if (intervalDays && intervalDays > 0) {
        nextDueDate.setDate(nextDueDate.getDate() + intervalDays);
      } else {
        // Default to weekly if intervalDays is not specified
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      }
      break;
    default:
      // For one-time tasks, set next due date to 1 month later (arbitrary)
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  }

  return nextDueDate;
}
