import { z } from "zod";
import { countAll, previewTestData, purgeRecords } from "../db";
import { adminProcedure, router } from "../_core/trpc";

/** Admin-only housekeeping. Deletion is always by explicit ids and needs the literal confirmation word. */
export const maintenanceRouter = router({
  counts: adminProcedure.query(async () => countAll()),
  previewTestData: adminProcedure
    .input(z.object({ phones: z.array(z.string().trim().min(3)).max(50), nameFragments: z.array(z.string().trim().min(2)).max(50), sessionPrefixes: z.array(z.string().trim().min(3)).max(20) }))
    .query(async ({ input }) => previewTestData(input)),
  purge: adminProcedure
    .input(z.object({
      confirm: z.literal("DELETE"),
      orderIds: z.array(z.number().int().positive()).default([]),
      leadIds: z.array(z.number().int().positive()).default([]),
      customerIds: z.array(z.number().int().positive()).default([]),
      conversationIds: z.array(z.number().int().positive()).default([]),
      sessionPrefixes: z.array(z.string().trim().min(3)).default([]),
    }))
    .mutation(async ({ input }) => purgeRecords(input)),
});
