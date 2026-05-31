import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const ADMIN_ROLES = ['admin', 'super_admin'];
    if (!ctx.user || !ADMIN_ROLES.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Gestor procedure — requires authenticated user with role 'gestor' or 'admin'.
 * Admin can always access gestor routes (for testing/oversight).
 */
export const gestorProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const GESTOR_ROLES = ['gestor', 'admin', 'super_admin'];
    if (!ctx.user || !GESTOR_ROLES.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Gestor access required" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
