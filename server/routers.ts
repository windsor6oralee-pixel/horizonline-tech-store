import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE, createAdminSession, validateAdminCredentials } from "./adminAuth";
import { commerceRouter } from "./routers/commerce";
import { ordersRouter } from "./routers/orders";
import { presenceRouter } from "./routers/presence";
import { settingsRouter } from "./routers/settings";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  adminAuth: router({
    login: publicProcedure.input(z.object({ username: z.string().trim().min(1).max(80), password: z.string().min(1).max(200) })).mutation(async ({ input, ctx }) => {
      if (!validateAdminCredentials(input.username, input.password)) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
      const token = await createAdminSession();
      const options = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(ADMIN_SESSION_COOKIE, token, { ...options, maxAge: 12 * 60 * 60 * 1000 });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const options = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_SESSION_COOKIE, { ...options, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(ADMIN_SESSION_COOKIE, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  commerce: commerceRouter,
  orders: ordersRouter,
  settings: settingsRouter,
  presence: presenceRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
