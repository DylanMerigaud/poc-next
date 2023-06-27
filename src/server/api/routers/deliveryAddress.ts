import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const SDeliveryAddressCreate = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

export const deliveryAddressRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.deliveryAddress.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),

  create: protectedProcedure
    .input(SDeliveryAddressCreate)
    .mutation(({ input, ctx }) => {
      return ctx.prisma.deliveryAddress.create({
        data: {
          street: input.street,
          city: input.city,
          state: input.state,
          zip: input.zip,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(SDeliveryAddressCreate.partial().merge(z.object({ id: z.string() })))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.deliveryAddress.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          street: input.street,
          city: input.city,
          state: input.state,
          zip: input.zip,
        },
      });
    }),

  updateAll: protectedProcedure
    .input(
      z.array(
        SDeliveryAddressCreate.partial().merge(z.object({ id: z.string() }))
      )
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.$transaction(
        input.map((address) => {
          return ctx.prisma.deliveryAddress.updateMany({
            where: {
              id: address.id,
              userId: ctx.session.user.id,
            },
            data: {
              street: address.street,
              city: address.city,
              state: address.state,
              zip: address.zip,
            },
          });
        })
      );
    }),
});
