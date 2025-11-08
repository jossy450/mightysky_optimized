import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import { knowledgeBase, customerServiceRequests, InsertKnowledgeBase, InsertCustomerServiceRequest } from "../drizzle/schema";
import { like, desc } from "drizzle-orm";

/**
 * Search the knowledge base for a question that matches the user's query.
 * Uses a simple LIKE search for now; can be enhanced with full-text search later.
 */
export async function searchKnowledgeBase(query: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search knowledge base: database not available");
    return [];
  }

  const results = await db
    .select()
    .from(knowledgeBase)
    .where(like(knowledgeBase.question, `%${query}%`))
    .limit(5);

  return results;
}

/**
 * Add a new Q&A pair to the knowledge base.
 */
export async function addToKnowledgeBase(data: InsertKnowledgeBase) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add to knowledge base: database not available");
    return null;
  }

  const result = await db.insert(knowledgeBase).values(data);
  return result;
}

/**
 * Create a new customer service request.
 */
export async function createCustomerServiceRequest(data: InsertCustomerServiceRequest) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create customer service request: database not available");
    return null;
  }

  const result = await db.insert(customerServiceRequests).values(data);
  return result;
}

/**
 * Get all pending customer service requests.
 */
export async function getPendingRequests() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get pending requests: database not available");
    return [];
  }

  const results = await db
    .select()
    .from(customerServiceRequests)
    .where(eq(customerServiceRequests.status, "pending"))
    .orderBy(desc(customerServiceRequests.createdAt));

  return results;
}

/**
 * Update a customer service request with an answer and mark it as answered.
 */
export async function answerCustomerServiceRequest(
  requestId: number,
  answer: string,
  answeredBy: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot answer customer service request: database not available");
    return null;
  }

  const result = await db
    .update(customerServiceRequests)
    .set({
      answer,
      answeredBy,
      status: "answered",
      answeredAt: new Date(),
    })
    .where(eq(customerServiceRequests.id, requestId));

  return result;
}

/**
 * Get a customer service request by ID.
 */
export async function getCustomerServiceRequestById(requestId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get customer service request: database not available");
    return null;
  }

  const results = await db
    .select()
    .from(customerServiceRequests)
    .where(eq(customerServiceRequests.id, requestId))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}
