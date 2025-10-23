import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoles = ["student", "admin", "supervisor", "treasurer", "vc"] as const;

// ============ USERS & AUTHENTICATION ============
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  universityId: text("university_id").unique(),
  role: text("role", { enum: userRoles }).notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  account: one(accounts, {
    fields: [users.id],
    references: [accounts.userId],
  }),
  workApplications: many(workApplications),
  timecards: many(timecards),
  candidacies: many(candidates),
  handovers: many(handovers),
}));

// ============ CHAPA360 (FINANCE) ============
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  accountNumber: text("account_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type", { enum: ["credit", "debit"] }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

// ============ SWSMS (WORK STUDY) ============
export const workApplications = pgTable("work_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  department: text("department").notNull(),
  position: text("position").notNull(),
  hoursPerWeek: integer("hours_per_week").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workApplicationsRelations = relations(workApplications, ({ one, many }) => ({
  user: one(users, {
    fields: [workApplications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [workApplications.reviewedBy],
    references: [users.id],
  }),
  timecards: many(timecards),
  payments: many(payments),
}));

export const timecards = pgTable("timecards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => workApplications.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }).notNull(),
  taskDescription: text("task_description").notNull(),
  qrCode: text("qr_code"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  status: text("status", { enum: ["pending", "verified", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timecardsRelations = relations(timecards, ({ one }) => ({
  application: one(workApplications, {
    fields: [timecards.applicationId],
    references: [workApplications.id],
  }),
  user: one(users, {
    fields: [timecards.userId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [timecards.verifiedBy],
    references: [users.id],
  }),
}));

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => workApplications.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(),
  status: text("status", { enum: ["pending", "processed", "failed"] }).notNull().default("pending"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  application: one(workApplications, {
    fields: [payments.applicationId],
    references: [workApplications.id],
  }),
}));

// ============ SGMS (GOVERNANCE) ============
export const elections = pgTable("elections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status", { enum: ["upcoming", "active", "completed"] }).notNull().default("upcoming"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const electionsRelations = relations(elections, ({ many }) => ({
  candidates: many(candidates),
  votes: many(votes),
}));

export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  position: text("position").notNull(),
  manifesto: text("manifesto").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  election: one(elections, {
    fields: [candidates.electionId],
    references: [elections.id],
  }),
  user: one(users, {
    fields: [candidates.userId],
    references: [users.id],
  }),
  votes: many(votes),
}));

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  voterId: varchar("voter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votesRelations = relations(votes, ({ one }) => ({
  election: one(elections, {
    fields: [votes.electionId],
    references: [elections.id],
  }),
  candidate: one(candidates, {
    fields: [votes.candidateId],
    references: [candidates.id],
  }),
  voter: one(users, {
    fields: [votes.voterId],
    references: [users.id],
  }),
}));

export const handovers = pgTable("handovers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  position: text("position").notNull(),
  documentUrl: text("document_url"),
  notes: text("notes"),
  status: text("status", { enum: ["pending", "completed"] }).notNull().default("pending"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const handoversRelations = relations(handovers, ({ one }) => ({
  fromUser: one(users, {
    fields: [handovers.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [handovers.toUserId],
    references: [users.id],
  }),
}));

// ============ INSERT SCHEMAS ============
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertWorkApplicationSchema = createInsertSchema(workApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewNotes: true,
  status: true,
});

export const insertTimecardSchema = createInsertSchema(timecards).omit({
  id: true,
  createdAt: true,
  verifiedBy: true,
  status: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertElectionSchema = createInsertSchema(elections).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertHandoverSchema = createInsertSchema(handovers).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// ============ TYPE EXPORTS ============
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type WorkApplication = typeof workApplications.$inferSelect;
export type InsertWorkApplication = z.infer<typeof insertWorkApplicationSchema>;

export type Timecard = typeof timecards.$inferSelect;
export type InsertTimecard = z.infer<typeof insertTimecardSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Election = typeof elections.$inferSelect;
export type InsertElection = z.infer<typeof insertElectionSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

export type Handover = typeof handovers.$inferSelect;
export type InsertHandover = z.infer<typeof insertHandoverSchema>;
