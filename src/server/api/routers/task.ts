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
      const { userIds, dueDate, startDate, ...taskData } = input;
      // startDate and dueDate are extracted to exclude them from taskData
      // These fields are used for assignments but not stored in the task itself

      // Create the task
      const task = await ctx.db.task.create({
        data: {
          ...taskData,
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

          // For rotation tasks, we also need to store the original order of users
          // Create placeholder assignments with status=SKIPPED for the remaining users
          // This will help maintain the rotation order
          if (userIds.length > 1) {
            await Promise.all(
              userIds.slice(1).map(async (userId) => {
                await ctx.db.taskAssignment.create({
                  data: {
                    taskId: task.id,
                    userId: userId ?? "",
                    assignedById: ctx.session.user.id,
                    dueDate,
                    status: "SKIPPED", // Mark as skipped so they don't show up as active assignments
                  },
                });
              }),
            );
          }
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
        const tenant = await ctx.db.tenantProfile.findFirst({
          where: {
            propertyId: taskData.propertyId,
            ...(taskData.roomId ? { roomId: taskData.roomId } : {}),
          },
          select: { userId: true },
          orderBy: { createdAt: "asc" },
        });

        if (tenant) {
          await ctx.db.taskAssignment.create({
            data: {
              taskId: task.id,
              userId: tenant.userId,
              assignedById: ctx.session.user.id,
              dueDate,
            },
          });
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

          // No need to modify SKIPPED or COMPLETED assignments
          // as they're already in the correct state
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
        // Remove assignments for users no longer assigned
        if (userIdsToRemove.length > 0) {
          await tx.taskAssignment.deleteMany({
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
            // 3. Create SKIPPED assignments for the rest to maintain rotation order

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

                // Create SKIPPED assignments for the rest to maintain rotation order
                if (userIdsToAdd.length > 1) {
                  await Promise.all(
                    userIdsToAdd.slice(1).map(async (userId) => {
                      await tx.taskAssignment.create({
                        data: {
                          taskId,
                          userId,
                          assignedById: ctx.session.user.id,
                          dueDate: new Date(),
                          status: "SKIPPED", // Mark as skipped
                        },
                      });
                    }),
                  );
                }
              }
            }
            // Otherwise, keep existing assignments (rotation will happen when tasks are completed)
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
              // For assignToAll: get all tenants in the property/room
              // For useRotation: get all users explicitly assigned to this task
              let eligibleUsers: { userId: string }[] = [];

              if (assignment.task.assignToAll) {
                // Get all tenants in the property/room
                eligibleUsers = await tx.tenantProfile.findMany({
                  where: {
                    propertyId: assignment.task.propertyId,
                    ...(assignment.task.roomId
                      ? { roomId: assignment.task.roomId }
                      : {}),
                  },
                  select: { userId: true },
                });
              } else if (assignment.task.useRotation) {
                // For useRotation tasks, we need to get the users who were originally selected
                // when creating the task or updating its assignments

                // First, get users from the updateAssignments endpoint
                const taskAssignmentsHistory = await tx.taskAssignment.findMany(
                  {
                    where: {
                      taskId: assignment.task.id,
                    },
                    select: {
                      userId: true,
                      createdAt: true, // To order by creation time
                    },
                    orderBy: {
                      createdAt: "asc", // Get them in the order they were added
                    },
                    distinct: ["userId"],
                  },
                );

                // Extract the userIds in the original order
                eligibleUsers = taskAssignmentsHistory.map(
                  (a: { userId: string }) => ({
                    userId: a.userId,
                  }),
                );
              }

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
        // Determine eligible users
        let eligibleUsers: { userId: string }[] = [];

        if (assignment.task.assignToAll) {
          // Get all tenants in the property/room
          eligibleUsers = await tx.tenantProfile.findMany({
            where: {
              propertyId: assignment.task.propertyId,
              ...(assignment.task.roomId
                ? { roomId: assignment.task.roomId }
                : {}),
            },
            select: { userId: true },
          });
        } else if (assignment.task.useRotation) {
          // Get users in original order
          const taskAssignmentsHistory = await tx.taskAssignment.findMany({
            where: {
              taskId: assignment.task.id,
            },
            select: {
              userId: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "asc",
            },
            distinct: ["userId"],
          });

          eligibleUsers = taskAssignmentsHistory.map(
            (a: { userId: string }) => ({
              userId: a.userId,
            }),
          );
        }

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
