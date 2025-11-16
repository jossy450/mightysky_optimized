import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Enums
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);
export const statusEnum = pgEnum("status", ["pending", "answered"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),

  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),

  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),

  role: roleEnum("role").notNull().default("user"),

  createdAt: timestamp("createdAt").notNull().defaultNow(),

  // Use drizzle's $onUpdate helper instead of MySQL's ON UPDATE CURRENT_TIMESTAMP
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  lastSignedIn: timestamp("lastSignedIn").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Satisfaction survey responses.
 */
export const satisfactionSurveys = pgTable("satisfaction_surveys", {
  id: serial("id").primaryKey(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  feedback: text("feedback"), // Optional text feedback
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type SatisfactionSurvey = typeof satisfactionSurveys.$inferSelect;
export type InsertSatisfactionSurvey =
  typeof satisfactionSurveys.$inferInsert;

/**
 * Knowledge Base table for storing Q&A pairs that the chatbot learns.
 */
export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * Customer Service Requests table for tracking unanswered questions.
 */
export const customerServiceRequests = pgTable(
  "customer_service_requests",
  {
    id: serial("id").primaryKey(),
    userEmail: varchar("userEmail", { length: 320 }).notNull(),
    question: text("question").notNull(),

    priority: priorityEnum("priority")
      .notNull()
      .default("medium"),

    status: statusEnum("status")
      .notNull()
      .default("pending"),

    answeredBy: varchar("answeredBy", { length: 255 }),
    answeredAt: timestamp("answeredAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
);

export type CustomerServiceRequest =
  typeof customerServiceRequests.$inferSelect;
export type InsertCustomerServiceRequest =
  typeof customerServiceRequests.$inferInsert;
