import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const reportBase = {
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["TASKS", "PAYMENTS", "TENANTS", "CUSTOM"]),
  filters: z.any().optional(),
  isActive: z.boolean().optional(),
};

const createReportSchema = z.object(reportBase);
const updateReportSchema = z.object({
  id: z.string().cuid(),
  ...reportBase,
});

export const reportRouter = createTRPCRouter({
  getAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.report.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: adminProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const report = await ctx.db.report.findUnique({ where: { id: input } });
      if (!report)
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      return report;
    }),

  create: adminProcedure
    .input(createReportSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.report.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          filters: input.filters,
          isActive: input.isActive ?? true,
          createdById: ctx.session.user.id,
        },
      });
      return report;
    }),

  update: adminProcedure
    .input(updateReportSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.db.report.update({
        where: { id },
        data: {
          ...data,
          filters: data.filters,
        },
      });
      return updated;
    }),

  delete: adminProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.report.delete({ where: { id: input } });
      return { success: true };
    }),

  // Example execution endpoint stub (extensible later)
  run: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.report.findUnique({
        where: { id: input.id },
      });
      if (!report)
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });

      // Placeholder execution logic; expand per type
      return {
        id: report.id,
        type: report.type,
        result: [],
        generatedAt: new Date(),
      };
    }),
});
