import { DEVICES, PRESENCE_STEP_KEYS, stepIndex } from "@shared/presence";
import { z } from "zod";
import { getVisitorStats, recordVisitorSession } from "../db";
import { shouldPersist, snapshot, touch } from "../presence";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

export const presenceRouter = router({
  /** Heartbeat from a storefront visitor. Anonymous: only a random session id is sent. */
  ping: publicProcedure
    .input(z.object({
      sessionId: z.string().trim().min(6).max(64),
      view: z.enum(PRESENCE_STEP_KEYS as [string, ...string[]]),
      product: z.string().trim().max(160).nullish(),
      device: z.enum(DEVICES),
    }))
    .mutation(async ({ input }) => {
      const entry = touch(input);
      if (shouldPersist(entry)) {
        try {
          await recordVisitorSession({
            sessionId: input.sessionId,
            device: input.device,
            lastView: input.view,
            furthestStage: stepIndex(input.view),
            productTitle: input.product ?? null,
          });
        } catch (error) {
          console.warn("[Presence] Failed to record visit:", error);
        }
      }
      return { ok: true } as const;
    }),

  live: adminProcedure.query(async () => {
    const live = snapshot();
    let today = null;
    try {
      today = await getVisitorStats();
    } catch (error) {
      console.warn("[Presence] Failed to read visitor stats:", error);
    }
    return { ...live, today };
  }),
});
