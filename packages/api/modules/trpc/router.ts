import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import * as adminProcedures from "../admin/procedures";
import * as aiProcedures from "../ai/procedures";
import * as authProcedures from "../auth/procedures";
import * as billingProcedures from "../billing/procedures";
import * as newsletterProcedures from "../newsletter/procedures";
import * as teamProcedures from "../team/procedures";
import * as uploadsProcedures from "../uploads/procedures";
import * as chatProcedures from "../chat/procedures";
import { router } from "./trpc";

export const apiRouter = router({
  auth: router(authProcedures),
  billing: router(billingProcedures),
  team: router(teamProcedures),
  newsletter: router(newsletterProcedures),
  ai: router(aiProcedures),
  uploads: router(uploadsProcedures),
  admin: router(adminProcedures),
  chat: router(chatProcedures),
});

export type ApiRouter = typeof apiRouter;
export type ApiInput = inferRouterInputs<ApiRouter>;
export type ApiOutput = inferRouterOutputs<ApiRouter>;
