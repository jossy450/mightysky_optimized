import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  searchKnowledgeBase,
  createCustomerServiceRequest,
  getPendingRequests,
  getCustomerServiceRequestById,
  addToKnowledgeBase,
  answerCustomerServiceRequest,
  getAnsweredRequests,
  getAverageResponseTimeByPriority,
  getStaffPerformanceMetrics,
  getPriorityDistribution,
} from "./db";
import { detectPriority } from "./priorityDetection";
import { notifyStaffOfNewRequest, sendAnswerToCustomer } from "./emailService";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chatbot: router({
    /**
     * Query the chatbot with a user's question.
     * Returns an answer from the knowledge base or null if not found.
     */
    query: publicProcedure
      .input(z.object({ question: z.string() }))
      .query(async ({ input }) => {
        const results = await searchKnowledgeBase(input.question);
        if (results.length > 0) {
          return { answer: results[0].answer, found: true };
        }
        return { answer: null, found: false };
      }),

    /**
     * Create a customer service request when the chatbot cannot answer.
     */
    createRequest: publicProcedure
      .input(
        z.object({
          userEmail: z.string().email(),
          question: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // Detect priority based on keywords in the question
        const priority = detectPriority(input.question);
        const result = await createCustomerServiceRequest(
          input.userEmail,
          input.question,
          priority
        );

        // Send email notification to staff (use a timestamp as requestId fallback if insertId is unavailable)
        const requestId = Date.now();
        await notifyStaffOfNewRequest(input.userEmail, input.question, requestId);

        return { success: true };
      }),

    /**
     * Get all pending customer service requests (for staff dashboard).
     */
    getPendingRequests: protectedProcedure.query(async () => {
      const requests = await getPendingRequests();
      return requests;
    }),

    /**
     * Get all answered customer service requests (for audit log).
     */
       getAnsweredRequests: protectedProcedure.query(async () => {
      return await getAnsweredRequests();
    }),

    /**
     * Answer a customer service request and learn the Q&A pair.
     */
    answerRequest: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          answer: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get the request to retrieve the question
        const request = await getCustomerServiceRequestById(input.requestId);
        if (!request) {
          throw new Error("Request not found");
        }

        // Add the Q&A to the knowledge base
        await addToKnowledgeBase({
          question: request.question,
          answer: input.answer,
        });

        // Update the request as answered
        await answerCustomerServiceRequest(
          input.requestId,
          input.answer,
          ctx.user.name || ctx.user.email || "Staff"
        );

        // Send the answer to the customer via email
        await sendAnswerToCustomer(request.userEmail, request.question, input.answer);

        return { success: true, userEmail: request.userEmail };
      }),
  }),

  // Analytics endpoints
  analytics: router({
    getResponseTimeByPriority: protectedProcedure.query(async () => {
      return await getAverageResponseTimeByPriority();
    }),
    getStaffPerformance: protectedProcedure.query(async () => {
      return await getStaffPerformanceMetrics();
    }),
    getPriorityDistribution: protectedProcedure.query(async () => {
      return await getPriorityDistribution();
    }),
  }),


});

export type AppRouter = typeof appRouter;
