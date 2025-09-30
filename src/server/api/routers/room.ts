import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const roomRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const rooms = await ctx.db.room.findMany({
      include: {
        property: true,
        tenants: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            tenants: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rooms;
  }),

  getByProperty: protectedProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rooms = await ctx.db.room.findMany({
        where: { propertyId: input.propertyId },
        include: {
          property: true,
          tenants: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              tenants: true,
              tasks: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return rooms;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db.room.findUnique({
        where: { id: input.id },
        include: {
          property: true,
          tenants: {
            include: {
              user: true,
            },
          },
          tasks: {
            include: {
              assignments: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      return room;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        propertyId: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.db.room.create({
        data: {
          name: input.name,
          propertyId: input.propertyId,
          description: input.description,
          createdById: ctx.session.user.id,
        },
      });

      return room;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const room = await ctx.db.room.update({
        where: { id },
        data: updateData,
      });

      return room;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.room.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
