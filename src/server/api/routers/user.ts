import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  whoAmI: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),
});
