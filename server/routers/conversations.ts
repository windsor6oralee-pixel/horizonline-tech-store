import { nanoid } from "nanoid";
import { z } from "zod";
import {
  addConversationMessage, createConversation, findConversationByLead, getConversationByToken,
  listConversationMessages, listConversationsWithUnread, markConversationRead,
} from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

const messageBody = z.string().trim().min(1).max(2000);
/** 32 URL-safe characters: long enough that the link cannot be guessed. */
const newToken = () => nanoid(32);

export const conversationsRouter = router({
  /** Opens (or reuses) the thread for a follow-up and returns its private link. */
  openForLead: adminProcedure
    .input(z.object({
      leadId: z.number().int().positive(),
      customerName: z.string().trim().min(1).max(160),
      phone: z.string().trim().max(32).nullish(),
      productTitle: z.string().trim().min(1).max(255),
    }))
    .mutation(async ({ input }) => {
      const existing = await findConversationByLead(input.leadId);
      if (existing) return { token: existing.token, id: existing.id } as const;
      const created = await createConversation({
        token: newToken(),
        leadId: input.leadId,
        orderId: null,
        customerName: input.customerName,
        phone: input.phone ?? null,
        productTitle: input.productTitle,
      });
      return { token: created.token, id: created.id } as const;
    }),

  list: adminProcedure.query(async () => listConversationsWithUnread()),

  thread: adminProcedure
    .input(z.object({ id: z.number().int().positive(), markRead: z.boolean().optional() }))
    .query(async ({ input }) => {
      if (input.markRead) await markConversationRead(input.id);
      return listConversationMessages(input.id);
    }),

  replyAsAdmin: adminProcedure
    .input(z.object({ id: z.number().int().positive(), body: messageBody }))
    .mutation(async ({ input }) => {
      await addConversationMessage({ conversationId: input.id, sender: "admin", body: input.body });
      return { success: true } as const;
    }),

  /** Customer side: the token in the link stands in for a login, so nothing else is accepted. */
  byToken: publicProcedure
    .input(z.object({ token: z.string().trim().length(32) }))
    .query(async ({ input }) => {
      const conversation = await getConversationByToken(input.token);
      if (!conversation) return null;
      const messages = await listConversationMessages(conversation.id);
      return {
        customerName: conversation.customerName,
        productTitle: conversation.productTitle,
        closed: conversation.closed === "yes",
        messages: messages.map(m => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt })),
      };
    }),

  replyAsCustomer: publicProcedure
    .input(z.object({ token: z.string().trim().length(32), body: messageBody }))
    .mutation(async ({ input }) => {
      const conversation = await getConversationByToken(input.token);
      if (!conversation) throw new Error("رابط المحادثة غير صالح");
      if (conversation.closed === "yes") throw new Error("هذه المحادثة مغلقة");
      await addConversationMessage({ conversationId: conversation.id, sender: "customer", body: input.body });
      return { success: true } as const;
    }),
});
