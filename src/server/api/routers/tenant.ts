import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  adminProcedure,
  tenantProcedure,
} from "~/server/api/trpc";
import type { Payment } from "@prisma/client";
export type ApiPayment = Omit<Payment, "amount"> & { amount: number };

export const tenantRouter = createTRPCRouter({
  // Get current user's tenant profile
  getMyProfile: tenantProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.tenantProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        user: {
          include: {
            payments: true,
          },
        },
        property: true,
        room: true,
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tenant profile not found",
      });
    }

    // Convert Decimal values to numbers
    return {
      ...profile,
      monthlyRent: profile.monthlyRent.toNumber(),
      depositAmount: profile.depositAmount?.toNumber() ?? null,
      securityDeposit: profile.securityDeposit?.toNumber() ?? null,
      user: {
        ...profile.user,
        payments:
          profile.user.payments?.map(
            (payment: { amount: { toNumber: () => number } }) => ({
              ...payment,
              amount: payment.amount.toNumber(),
            }),
          ) ?? [],
      },
    };
  }),

  // Get all tenants (admin only)
  getAll: adminProcedure.query(async ({ ctx }) => {
    const tenants = await ctx.db.tenantProfile.findMany({
      include: {
        user: {
          include: {
            payments: {
              orderBy: { dueDate: "desc" },
              take: 5,
            },
            requests: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        property: true,
        room: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal values to numbers
    return tenants.map((tenant) => ({
      ...tenant,
      monthlyRent: tenant.monthlyRent.toNumber(),
      depositAmount: tenant.depositAmount?.toNumber() ?? null,
      securityDeposit: tenant.securityDeposit?.toNumber() ?? null,
      user: {
        ...tenant.user,
        payments: tenant.user.payments.map(
          (payment: { amount: { toNumber: () => number } }) => ({
            ...payment,
            amount: payment.amount.toNumber(),
          }),
        ),
      },
    }));
  }),

  // Get tenant by ID (admin only)
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenantProfile.findUnique({
        where: { id: input.id },
        include: {
          user: {
            include: {
              payments: {
                orderBy: { dueDate: "desc" },
              },
              requests: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
          property: true,
          room: true,
        },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found",
        });
      }

      // Convert Decimal values to numbers
      return {
        ...tenant,
        monthlyRent: tenant.monthlyRent.toNumber(),
        depositAmount: tenant.depositAmount?.toNumber() ?? null,
        securityDeposit: tenant.securityDeposit?.toNumber() ?? null,
        user: {
          ...tenant.user,
          payments: tenant.user.payments.map(
            (payment: { amount: { toNumber: () => number } }) =>
              ({
                ...payment,
                amount: payment.amount.toNumber(),
              }) as ApiPayment,
          ),
        },
      };
    }),

  // Create tenant profile (admin only)
  create: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        propertyId: z.string(),
        roomId: z.string().optional(),
        monthlyRent: z.number().positive(),
        rentDueDay: z.number().min(1).max(31),
        depositAmount: z.number().positive().optional(),
        securityDeposit: z.number().positive().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        moveInDate: z.date().optional(),
        leaseStartDate: z.date().optional(),
        leaseEndDate: z.date().optional(),
        remarks: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenantProfile.create({
        data: {
          userId: input.userId,
          propertyId: input.propertyId,
          roomId: input.roomId,
          monthlyRent: input.monthlyRent,
          rentDueDay: input.rentDueDay,
          depositAmount: input.depositAmount,
          securityDeposit: input.securityDeposit,
          emergencyContact: input.emergencyContact,
          emergencyPhone: input.emergencyPhone,
          moveInDate: input.moveInDate,
          leaseStartDate: input.leaseStartDate,
          leaseEndDate: input.leaseEndDate,
          remarks: input.remarks,
          notes: input.notes,
        },
        include: {
          user: true,
          property: true,
          room: true,
        },
      });

      return tenant;
    }),

  // Update tenant profile (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        propertyId: z.string().optional(),
        roomId: z.string().optional(),
        monthlyRent: z.number().positive().optional(),
        rentDueDay: z.number().min(1).max(31).optional(),
        depositAmount: z.number().positive().optional(),
        securityDeposit: z.number().positive().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        moveInDate: z.date().optional(),
        leaseStartDate: z.date().optional(),
        leaseEndDate: z.date().optional(),
        remarks: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const tenant = await ctx.db.tenantProfile.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          property: true,
          room: true,
        },
      });

      return tenant;
    }),

  // Delete tenant profile (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.tenantProfile.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
