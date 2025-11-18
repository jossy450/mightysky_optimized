import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  oauthAppAuthRedirect: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        redirectUri: z.string(),
        state: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const base = process.env.OAUTH_PORTAL_URL?.replace(/\/$/, "") ?? "";
      const url = new URL(`${base}/app-auth`);

      url.searchParams.set("appId", input.appId);
      url.searchParams.set("redirectUri", input.redirectUri);
      url.searchParams.set("type", "signIn");

      if (input.state) url.searchParams.set("state", input.state);

      return {
        redirectUrl: url.toString(),
      };
    }),
});
