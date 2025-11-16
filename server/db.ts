import { eq, desc, sql, like, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  InsertUser,
  users,
  satisfactionSurveys,
  knowledgeBase,
  customerServiceRequests,
  InsertKnowledgeBase,
  InsertCustomerServiceRequest,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, {
        prepare: false,
      });
      _db = drizzle(client);
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
      (values as any)[field] = normalized;
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
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Postgres-style upsert
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet as any,
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

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
 * Create a new customer service request with automatic priority detection.
 */
export async function createCustomerServiceRequest(
  userEmail: string,
  question: string,
  priority?: "high" | "medium" | "low",
) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot create customer service request: database not available",
    );
    return null;
  }

  const result = await db.insert(customerServiceRequests).values({
    userEmail,
    question,
    priority: priority || "medium", // Use provided priority or default to medium
  });

  return result;
}

/**
 * Get all pending customer service requests.
 */
export async function getPendingRequests() {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get pending requests: database not available",
    );
    return [];
  }

  // Sort by priority (high > medium > low) and then by creation date
  const results = await db
    .select()
    .from(customerServiceRequests)
    .where(eq(customerServiceRequests.status, "pending"))
    .orderBy(
      // Custom priority ordering: high=3, medium=2, low=1
      desc(customerServiceRequests.priority),
      desc(customerServiceRequests.createdAt),
    );

  return results;
}

/**
 * Update a customer service request with an answer and mark it as answered.
 */
export async function answerCustomerServiceRequest(
  requestId: number,
  answer: string,
  answeredBy: string,
) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot answer customer service request: database not available",
    );
    return null;
  }

  const result = await db
    .update(customerServiceRequests)
    .set({
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
    console.warn(
      "[Database] Cannot get customer service request: database not available",
    );
    return null;
  }

  const results = await db
    .select()
    .from(customerServiceRequests)
    .where(eq(customerServiceRequests.id, requestId))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/**
 * Get all answered customer service requests for audit log.
 */
export async function getAnsweredRequests() {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get answered requests: database not available",
    );
    return [];
  }

  const results = await db
    .select()
    .from(customerServiceRequests)
    .where(eq(customerServiceRequests.status, "answered"))
    .orderBy(desc(customerServiceRequests.answeredAt));

  return results;
}

/**
 * Get analytics data for average response time by priority.
 */
export async function getAverageResponseTimeByPriority(
  startDate?: string,
  endDate?: string,
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get analytics: database not available");
    return [];
  }

  // Build where conditions
  const conditions = [eq(customerServiceRequests.status, "answered")];
  if (startDate) {
    conditions.push(
      gte(customerServiceRequests.createdAt, new Date(startDate)),
    );
  }
  if (endDate) {
    conditions.push(
      lte(customerServiceRequests.createdAt, new Date(endDate)),
    );
  }

  const results = await db
    .select()
    .from(customerServiceRequests)
    .where(and(...conditions));

  // Calculate average response time for each priority
  const stats: { high: number[]; medium: number[]; low: number[] } = {
    high: [],
    medium: [],
    low: [],
  };

  results.forEach((req) => {
    if (req.answeredAt && req.createdAt) {
      const responseTime = req.answeredAt.getTime() - req.createdAt.getTime();
      stats[req.priority].push(responseTime);
    }
  });

  return [
    {
      priority: "high",
      avgResponseTime:
        stats.high.length > 0
          ? stats.high.reduce((a, b) => a + b, 0) / stats.high.length
          : 0,
      count: stats.high.length,
    },
    {
      priority: "medium",
      avgResponseTime:
        stats.medium.length > 0
          ? stats.medium.reduce((a, b) => a + b, 0) / stats.medium.length
          : 0,
      count: stats.medium.length,
    },
    {
      priority: "low",
      avgResponseTime:
        stats.low.length > 0
          ? stats.low.reduce((a, b) => a + b, 0) / stats.low.length
          : 0,
      count: stats.low.length,
    },
  ];
}

/**
 * Get staff performance metrics.
 */
export async function getStaffPerformanceMetrics(
  startDate?: string,
  endDate?: string,
) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get staff metrics: database not available",
    );
    return [];
  }

  // Build where conditions
  const conditions = [eq(customerServiceRequests.status, "answered")];
  if (startDate) {
    conditions.push(
      gte(customerServiceRequests.createdAt, new Date(startDate)),
    );
  }
  if (endDate) {
    conditions.push(
      lte(customerServiceRequests.createdAt, new Date(endDate)),
    );
  }

  const results = await db
    .select()
    .from(customerServiceRequests)
    .where(and(...conditions));

  // Group by staff member
  const staffStats: Record<
    string,
    { responseTimes: number[]; count: number }
  > = {};

  results.forEach((req) => {
    if (req.answeredBy && req.answeredAt && req.createdAt) {
      if (!staffStats[req.answeredBy]) {
        staffStats[req.answeredBy] = { responseTimes: [], count: 0 };
      }
      const responseTime = req.answeredAt.getTime() - req.createdAt.getTime();
      staffStats[req.answeredBy].responseTimes.push(responseTime);
      staffStats[req.answeredBy].count++;
    }
  });

  return Object.entries(staffStats).map(([staffName, stats]) => ({
    staffName,
    totalAnswered: stats.count,
    avgResponseTime:
      stats.responseTimes.reduce((a, b) => a + b, 0) /
      stats.responseTimes.length,
  }));
}

/**
 * Get priority distribution for all requests.
 */
export async function getPriorityDistribution(
  startDate?: string,
  endDate?: string,
) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get priority distribution: database not available",
    );
    return [];
  }

  // Build where conditions
  const conditions: any[] = [];
  if (startDate) {
    conditions.push(
      gte(customerServiceRequests.createdAt, new Date(startDate)),
    );
  }
  if (endDate) {
    conditions.push(
      lte(customerServiceRequests.createdAt, new Date(endDate)),
    );
  }

  const results =
    conditions.length > 0
      ? await db
          .select()
          .from(customerServiceRequests)
          .where(and(...conditions))
      : await db.select().from(customerServiceRequests);

  const distribution = { high: 0, medium: 0, low: 0 };

  results.forEach((req) => {
    distribution[req.priority]++;
  });

  return [
    { priority: "high", count: distribution.high },
    { priority: "medium", count: distribution.medium },
    { priority: "low", count: distribution.low },
  ];
}

// Knowledge Base Management Functions
export async function getAllKnowledgeBasePairs() {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get knowledge base pairs: database not available",
    );
    return [];
  }

  const results = await db
    .select()
    .from(knowledgeBase)
    .orderBy(desc(knowledgeBase.createdAt));

  return results;
}

export async function updateKnowledgeBasePair(
  id: number,
  question: string,
  answer: string,
) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot update knowledge base pair: database not available",
    );
    return false;
  }

  await db
    .update(knowledgeBase)
    .set({ question, answer })
    .where(eq(knowledgeBase.id, id));

  return true;
}

export async function deleteKnowledgeBasePair(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot delete knowledge base pair: database not available",
    );
    return false;
  }

  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));

  return true;
}

export async function createKnowledgeBasePair(
  question: string,
  answer: string,
) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot create knowledge base pair: database not available",
    );
    return null;
  }

  const result = await db
    .insert(knowledgeBase)
    .values({ question, answer });

  return result;
}

// ===== Satisfaction Survey Functions =====

export async function createSatisfactionSurvey(data: {
  customerEmail: string;
  rating: number;
  feedback?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(satisfactionSurveys).values({
    customerEmail: data.customerEmail,
    rating: data.rating,
    feedback: data.feedback || null,
  });
}

export async function getSatisfactionSurveyAnalytics(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(satisfactionSurveys);

  if (params?.startDate || params?.endDate) {
    const conditions: any[] = [];
    if (params.startDate) {
      conditions.push(
        gte(satisfactionSurveys.createdAt, params.startDate),
      );
    }
    if (params.endDate) {
      conditions.push(
        lte(satisfactionSurveys.createdAt, params.endDate),
      );
    }
    query = query.where(and(...conditions)) as any;
  }

  const surveys = await query;

  // Calculate analytics
  const totalSurveys = surveys.length;
  const averageRating =
    totalSurveys > 0
      ? surveys.reduce((sum, s) => sum + s.rating, 0) / totalSurveys
      : 0;

  const ratingDistribution = {
    1: surveys.filter((s) => s.rating === 1).length,
    2: surveys.filter((s) => s.rating === 2).length,
    3: surveys.filter((s) => s.rating === 3).length,
    4: surveys.filter((s) => s.rating === 4).length,
    5: surveys.filter((s) => s.rating === 5).length,
  };

  return {
    totalSurveys,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
    recentFeedback: surveys
      .filter((s) => s.feedback)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((s) => ({
        rating: s.rating,
        feedback: s.feedback,
        createdAt: s.createdAt,
      })),
  };
}

export async function getSatisfactionTrends(params?: {
  days?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Determine date range
  let startDate: Date;
  let endDate: Date;

  if (params?.startDate && params?.endDate) {
    startDate = params.startDate;
    endDate = params.endDate;
  } else {
    const days = params?.days || 30;
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
  }

  const surveys = await db
    .select()
    .from(satisfactionSurveys)
    .where(
      and(
        gte(satisfactionSurveys.createdAt, startDate),
        lte(satisfactionSurveys.createdAt, endDate),
      ),
    )
    .orderBy(satisfactionSurveys.createdAt);

  // Group by date and calculate daily average
  const dailyData = new Map<string, { total: number; count: number }>();

  surveys.forEach((survey) => {
    const dateKey = survey.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
    const existing = dailyData.get(dateKey) || { total: 0, count: 0 };
    dailyData.set(dateKey, {
      total: existing.total + survey.rating,
      count: existing.count + 1,
    });
  });

  // Generate array with all dates in range, filling gaps with null
  const result: {
    date: string;
    averageRating: number | null;
    surveyCount: number;
  }[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split("T")[0];
    const data = dailyData.get(dateKey);

    result.push({
      date: dateKey,
      averageRating: data
        ? Math.round((data.total / data.count) * 10) / 10
        : null,
      surveyCount: data ? data.count : 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

export async function compareSatisfactionTrends(params: {
  period1Start: Date;
  period1End: Date;
  period2Start: Date;
  period2End: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get trends for both periods
  const period1Trends = await getSatisfactionTrends({
    startDate: params.period1Start,
    endDate: params.period1End,
  });

  const period2Trends = await getSatisfactionTrends({
    startDate: params.period2Start,
    endDate: params.period2End,
  });

  // Calculate summary statistics for each period
  const calculateStats = (trends: typeof period1Trends) => {
    const validRatings = trends
      .filter((t) => t.averageRating !== null)
      .map((t) => t.averageRating!);
    const totalSurveys = trends.reduce(
      (sum, t) => sum + t.surveyCount,
      0,
    );
    const avgRating =
      validRatings.length > 0
        ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
        : 0;

    return {
      averageRating: Math.round(avgRating * 10) / 10,
      totalSurveys,
      daysWithData: validRatings.length,
    };
  };

  const period1Stats = calculateStats(period1Trends);
  const period2Stats = calculateStats(period2Trends);

  // Calculate comparison metrics
  const ratingChange =
    period1Stats.averageRating - period2Stats.averageRating;
  const percentageChange =
    period2Stats.averageRating > 0
      ? Math.round(
          (ratingChange / period2Stats.averageRating) * 100 * 10,
        ) / 10
      : 0;

  return {
    period1: {
      trends: period1Trends,
      stats: period1Stats,
    },
    period2: {
      trends: period2Trends,
      stats: period2Stats,
    },
    comparison: {
      ratingChange: Math.round(ratingChange * 10) / 10,
      percentageChange,
      surveyCountChange:
        period1Stats.totalSurveys - period2Stats.totalSurveys,
    },
  };
}
