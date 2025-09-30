import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const propertyRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const properties = await ctx.db.property.findMany({
      include: {
        rooms: true,
        tenants: {
          include: {
            user: true,
            room: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            tenants: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return properties;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const property = await ctx.db.property.findUnique({
        where: { id: input.id },
        include: {
          rooms: true,
          tenants: {
            include: {
              user: true,
              room: true,
            },
          },
          _count: {
            select: {
              rooms: true,
              tenants: true,
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

      return property;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const property = await ctx.db.property.create({
        data: {
          name: input.name,
          address: input.address,
          description: input.description,
          createdById: ctx.session.user.id,
        },
      });

      return property;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        address: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const property = await ctx.db.property.update({
        where: { id },
        data: updateData,
      });

      return property;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.property.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
