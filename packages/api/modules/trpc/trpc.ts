import { TRPCError, initTRPC } from "@trpc/server";
import { UserRoleSchema } from "database";
import { logger } from "logs";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten((issue) => {
                return issue;
              })
            : null,
      },
    };
  },
});

const isAuthenticatedMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session!,
    },
  });
});

const isAdminMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.user.role !== UserRoleSchema.Values.ADMIN) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session!,
    },
  });
});

const loggerMiddleware = t.middleware(async (opts) => {
  const { type, next, path } = opts;
  const start = Date.now();
  const request = await next(opts);
  const duration = Date.now() - start;

  const logLabel = `${type.toUpperCase()} ${path} in ${duration}ms`;

  request.ok ? logger.info(logLabel) : logger.error(logLabel);

  return request;
});

export const { router, createCallerFactory } = t;
export const publicProcedure = t.procedure.use(loggerMiddleware);
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(isAuthenticatedMiddleware);
export const adminProcedure = t.procedure
  .use(loggerMiddleware)
  .use(isAdminMiddleware);

export { TRPCError };
