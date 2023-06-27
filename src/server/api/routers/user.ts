import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  whoAmI: protectedProcedure.query(({ ctx }) => {
    console.log(ctx.session.user);
    return ctx.session.user;
  }),
});
