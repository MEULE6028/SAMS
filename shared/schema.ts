import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoles = ["student", "admin", "supervisor", "treasurer", "vc", "wSupervisor", "deanLadies", "deanMen"] as const;

// ============ USERS & AUTHENTICATION ============
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  universityId: text("university_id").unique(),
  studentId: text("student_id").unique(), // Maps to external API student ID
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
  applicationId: text("application_id").notNull().unique(), // e.g., WS-2025-A1B2C
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Basic Personal Information (from UEAB form)
  fullName: text("full_name").notNull(),
  gender: text("gender", { enum: ["male", "female"] }),
  age: integer("age").notNull(),
  maritalStatus: text("marital_status", { enum: ["single", "married", "divorced", "widowed"] }),
  major: text("major").notNull(),
  academicClassification: text("academic_classification").notNull(), // Freshman, Sophomore, Junior, Senior, Graduate
  mobileContact: text("mobile_contact").notNull(),

  // Sponsorship Information
  isSponsored: boolean("is_sponsored").notNull().default(false),
  sponsorName: text("sponsor_name"),

  // Work Experience
  workExperiences: text("work_experiences"),
  hasWorkedOnCampusBefore: boolean("has_worked_on_campus_before").notNull().default(false),
  previousCampusWorkLocation: text("previous_campus_work_location"),

  // UEAB Registration & Work History
  firstRegistrationYear: text("first_registration_year"), // e.g., "2023"
  firstRegistrationSemester: text("first_registration_semester"), // e.g., "Fall", "Spring"
  startedWorkingMonth: text("started_working_month"),
  startedWorkingYear: text("started_working_year"),

  // Current Application Details
  department: text("department").notNull(),
  position: text("position").notNull(),
  // Academic semester label e.g., "2024/2025.1", "2024/2025.2", "2024/2025.3"
  academicSemester: text("academic_semester"),
  isRegisteringFirstSemester: boolean("is_registering_first_semester").notNull().default(false),
  registeredUnitsHours: integer("registered_units_hours"), // Credit hours/units

  // Financial Information
  accountNumber: text("account_number").notNull(),
  latestAccountBalance: decimal("latest_account_balance", { precision: 10, scale: 2 }),
  accountStatementAttached: boolean("account_statement_attached").notNull().default(false),

  // Work Preferences (legacy fields for compatibility)
  hoursPerWeek: integer("hours_per_week").notNull(),
  reason: text("reason"),
  availability: text("availability"),
  skills: text("skills"),
  previousExperience: text("previous_experience"),

  // Rules Acknowledgment
  rulesAcknowledged: boolean("rules_acknowledged").notNull().default(false),
  acknowledgedAt: timestamp("acknowledged_at"),

  // Signature & Submission
  signatureData: text("signature_data"), // Base64 encoded signature image
  signedAt: timestamp("signed_at"),

  // Enhanced Workflow Status
  status: text("status", {
    enum: [
      "pending",           // Initial submission
      "under_review",      // Automated eligibility check in progress
      "auto_rejected",     // Failed automated checks (can appeal)
      "appealed",          // Student appealed auto-rejection
      "supervisor_review", // Passed checks, awaiting supervisor approval
      "approved",          // Final approval - can start working
      "rejected"           // Final rejection by supervisor
    ]
  }).notNull().default("pending"),

  // Eligibility Check Results
  eligibilityChecked: boolean("eligibility_checked").notNull().default(false),
  eligibilityPassed: boolean("eligibility_passed"),
  eligibilityDetails: text("eligibility_details"), // JSON with check results

  // Fee Balance Check
  feeBalanceAtSubmission: decimal("fee_balance_at_submission", { precision: 10, scale: 2 }),
  feeBalanceEligible: boolean("fee_balance_eligible"),

  // Registration Check
  isRegisteredCurrentSemester: boolean("is_registered_current_semester"),
  creditHoursAtSubmission: integer("credit_hours_at_submission"),
  creditHoursEligible: boolean("credit_hours_eligible"),

  // Appeal Information
  hasAppealed: boolean("has_appealed").notNull().default(false),
  appealReason: text("appeal_reason"),
  appealedAt: timestamp("appealed_at"),
  appealReviewedBy: varchar("appeal_reviewed_by").references(() => users.id),
  appealReviewNotes: text("appeal_review_notes"),

  // Supervisor Review
  supervisorId: varchar("supervisor_id").references(() => users.id),
  supervisorReviewedAt: timestamp("supervisor_reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),

  // Timestamps
  submittedAt: timestamp("submitted_at"),
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
  hourlyRate: decimal("hourly_rate", { precision: 6, scale: 2 }),
  earnings: decimal("earnings", { precision: 8, scale: 2 }),
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

// Department Rates for Work Study Program
export const departmentRates = pgTable("department_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  department: text("department").notNull().unique(),
  description: text("description"), // Description of what the department does
  hourlyRate: decimal("hourly_rate", { precision: 6, scale: 2 }).notNull(), // KSh per hour
  isActive: boolean("is_active").notNull().default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departmentRatesRelations = relations(departmentRates, ({ one, many }) => ({
  updater: one(users, {
    fields: [departmentRates.updatedBy],
    references: [users.id],
  }),
  positions: many(departmentPositions),
}));

// Positions available within each department
export const departmentPositions = pgTable("department_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull().references(() => departmentRates.id, { onDelete: "cascade" }),
  position: text("position").notNull(), // e.g., "Janitor", "Secretary Assistant", "Cook"
  description: text("description"), // What this position does
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departmentPositionsRelations = relations(departmentPositions, ({ one }) => ({
  department: one(departmentRates, {
    fields: [departmentPositions.departmentId],
    references: [departmentRates.id],
  }),
}));

// ============ SGMS (GOVERNANCE) ============

// Election Positions
export const electionPositions = pgTable("election_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  slotsAvailable: integer("slots_available").notNull().default(1),
  department: text("department"),
  category: text("category"), // "Executive", "Class Rep", etc.

  // Voting Eligibility Restrictions
  genderRestriction: text("gender_restriction", { enum: ["male", "female", "all"] }).notNull().default("all"),
  residenceRestriction: text("residence_restriction", { enum: ["oncampus", "offcampus", "all"] }).notNull().default("all"),
  schoolRestriction: text("school_restriction"), // Specific school name or null for "all"

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const electionPositionsRelations = relations(electionPositions, ({ many }) => ({
  applications: many(candidateApplications),
  candidates: many(candidates),
}));

// Elections
export const elections = pgTable("elections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  applicationStartDate: timestamp("application_start_date"),
  applicationEndDate: timestamp("application_end_date"),
  votingStartDate: timestamp("voting_start_date").notNull(),
  votingEndDate: timestamp("voting_end_date").notNull(),
  // Legacy fields for backward compatibility
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status", { enum: ["upcoming", "applications", "active", "closed", "completed"] }).notNull().default("upcoming"),
  resultsApproved: boolean("results_approved").notNull().default(false),
  resultsPublishedAt: timestamp("results_published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const electionsRelations = relations(elections, ({ many }) => ({
  applications: many(candidateApplications),
  candidates: many(candidates),
  votes: many(votes),
}));

// Candidate Applications
export const candidateApplications = pgTable("candidate_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  positionId: varchar("position_id").notNull().references(() => electionPositions.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  manifesto: text("manifesto").notNull(),
  qualifications: text("qualifications"),
  visionStatement: text("vision_statement"),
  photoUrl: text("photo_url"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

export const candidateApplicationsRelations = relations(candidateApplications, ({ one }) => ({
  election: one(elections, {
    fields: [candidateApplications.electionId],
    references: [elections.id],
  }),
  position: one(electionPositions, {
    fields: [candidateApplications.positionId],
    references: [electionPositions.id],
  }),
  student: one(users, {
    fields: [candidateApplications.studentId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [candidateApplications.reviewedBy],
    references: [users.id],
  }),
}));

// Candidates (Approved)
export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  positionId: varchar("position_id").references(() => electionPositions.id, { onDelete: "set null" }),
  applicationId: varchar("application_id").references(() => candidateApplications.id, { onDelete: "set null" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  position: text("position").notNull(), // Keep for backward compatibility
  manifesto: text("manifesto").notNull(),
  qualifications: text("qualifications"),
  visionStatement: text("vision_statement"),
  photoUrl: text("photo_url"),
  isWinner: boolean("is_winner").notNull().default(false),
  voteCount: integer("vote_count").notNull().default(0),
  votePercentage: numeric("vote_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  election: one(elections, {
    fields: [candidates.electionId],
    references: [elections.id],
  }),
  position: one(electionPositions, {
    fields: [candidates.positionId],
    references: [electionPositions.id],
  }),
  application: one(candidateApplications, {
    fields: [candidates.applicationId],
    references: [candidateApplications.id],
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
  positionId: varchar("position_id").references(() => electionPositions.id, { onDelete: "set null" }),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  voterId: varchar("voter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votesRelations = relations(votes, ({ one }) => ({
  election: one(elections, {
    fields: [votes.electionId],
    references: [elections.id],
  }),
  position: one(electionPositions, {
    fields: [votes.positionId],
    references: [electionPositions.id],
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

// ============ SIGN-OUT APPLICATIONS ============
export const signOutApplications = pgTable("sign_out_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roomNumber: text("room_number"),
  destination: text("destination").notNull(),
  meansOfTravel: text("means_of_travel").notNull(),
  purposeOfTravel: text("purpose_of_travel").notNull(),

  // Leave type: day_leave, overnight, weekend, other
  leaveType: text("leave_type", { enum: ["day_leave", "overnight", "weekend", "other"] }).notNull(),
  leaveTypeOther: text("leave_type_other"), // if "other" is selected

  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  contactDuringAbsence: text("contact_during_absence").notNull(),

  // Emergency contact information
  emergencyContact: text("emergency_contact").notNull(),
  emergencyPhone: text("emergency_phone").notNull(),
  parentApproval: boolean("parent_approval").notNull().default(false),

  // Missed classes and instructor approvals (JSON array)
  missedClasses: text("missed_classes"), // JSON: [{className: string, instructorName: string, instructorSignature: boolean}]

  // Multi-level approval workflow
  dormDeanApproval: text("dorm_dean_approval", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  dormDeanSignedBy: varchar("dorm_dean_signed_by").references(() => users.id),
  dormDeanSignedAt: timestamp("dorm_dean_signed_at"),
  dormDeanNotes: text("dorm_dean_notes"),

  deanOfStudentsApproval: text("dean_of_students_approval", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  deanOfStudentsSignedBy: varchar("dean_of_students_signed_by").references(() => users.id),
  deanOfStudentsSignedAt: timestamp("dean_of_students_signed_at"),
  deanOfStudentsNotes: text("dean_of_students_notes"),

  registrarApproval: text("registrar_approval", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  registrarSignedBy: varchar("registrar_signed_by").references(() => users.id),
  registrarSignedAt: timestamp("registrar_signed_at"),
  registrarNotes: text("registrar_notes"),

  // Overall status (approved only when all three approve)
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),

  // Legacy fields for compatibility
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reason: text("reason"), // Mapped from purposeOfTravel

  semesterCount: integer("semester_count").notNull().default(1),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const signOutApplicationsRelations = relations(signOutApplications, ({ one }) => ({
  user: one(users, {
    fields: [signOutApplications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [signOutApplications.reviewedBy],
    references: [users.id],
  }),
}));

// ============ RESIDENCE CHANGE REQUESTS ============
export const residenceChangeRequests = pgTable("residence_change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentResidenceType: text("current_residence_type").notNull(),
  requestedResidenceType: text("requested_residence_type").notNull(),
  reason: text("reason").notNull(),
  preferredHostelId: integer("preferred_hostel_id"),
  specialNeeds: text("special_needs"),
  preferredRoommate: text("preferred_roommate"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const residenceChangeRequestsRelations = relations(residenceChangeRequests, ({ one }) => ({
  user: one(users, {
    fields: [residenceChangeRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [residenceChangeRequests.reviewedBy],
    references: [users.id],
  }),
}));

// ============ WALLET WITHDRAWALS ============
export const walletWithdrawals = pgTable("wallet_withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method", { enum: ["mpesa", "bank", "cash"] }).notNull(),
  destination: text("destination").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletWithdrawalsRelations = relations(walletWithdrawals, ({ one }) => ({
  account: one(accounts, {
    fields: [walletWithdrawals.accountId],
    references: [accounts.id],
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

export const insertWorkApplicationSchema = createInsertSchema(workApplications, {
  age: z.coerce.number().int().positive(),
  registeredUnitsHours: z.coerce.number().int().positive().optional(),
  hoursPerWeek: z.coerce.number().int().positive(),
  // Preprocess empty strings to undefined before validation
  gender: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["male", "female"]).optional()
  ),
  maritalStatus: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["single", "married", "divorced", "widowed"]).optional()
  ),
}).omit({
  id: true,
  applicationId: true, // Generated automatically
  userId: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewNotes: true,
  status: true,
  submittedAt: true,
  eligibilityChecked: true,
  eligibilityPassed: true,
  eligibilityDetails: true,
  feeBalanceAtSubmission: true,
  feeBalanceEligible: true,
  isRegisteredCurrentSemester: true,
  creditHoursAtSubmission: true,
  creditHoursEligible: true,
  hasAppealed: true,
  appealReason: true,
  appealedAt: true,
  appealReviewedBy: true,
  appealReviewNotes: true,
  supervisorId: true,
  supervisorReviewedAt: true,
});

export const insertTimecardSchema = createInsertSchema(timecards, {
  date: z.union([z.string(), z.date()]).transform((val) => typeof val === 'string' ? new Date(val) : val),
}).omit({
  id: true,
  userId: true,      // Backend adds this from authenticated user
  createdAt: true,
  verifiedBy: true,
  status: true,
  hourlyRate: true,  // Calculated on backend from department
  earnings: true,    // Calculated on backend after verification
  qrCode: true,      // Generated on backend
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertDepartmentRateSchema = createInsertSchema(departmentRates, {
  hourlyRate: z.coerce.number().positive(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
});

export const insertDepartmentPositionSchema = createInsertSchema(departmentPositions).omit({
  id: true,
  createdAt: true,
});

export const insertElectionPositionSchema = createInsertSchema(electionPositions).omit({
  id: true,
  createdAt: true,
});

export const insertElectionSchema = createInsertSchema(elections).omit({
  id: true,
  createdAt: true,
  resultsPublishedAt: true,
});

export const insertCandidateApplicationSchema = createInsertSchema(candidateApplications).omit({
  id: true,
  appliedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  voteCount: true,
  votePercentage: true,
  isWinner: true,
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

export const insertSignOutApplicationSchema = createInsertSchema(signOutApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewNotes: true,
  status: true,
});

export const insertResidenceChangeRequestSchema = createInsertSchema(residenceChangeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewNotes: true,
  status: true,
});

export const insertWalletWithdrawalSchema = createInsertSchema(walletWithdrawals).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

// ============ HOSTEL/RESIDENCE ATTENDANCE (Local Tracking) ============
// Note: Residence data (hostels, rooms, assignments) now comes from external API
// We only track daily attendance locally for roll call (9:30 PM - 10:00 PM)

export const hostelAttendance = pgTable("hostel_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id"), // Made optional - references external API room or local room
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Attendance Details
  date: timestamp("date").notNull(), // Date of roll call
  checkInTime: timestamp("check_in_time"), // When student checked in
  status: text("status", { enum: ["present", "absent", "excused", "late"] }).notNull(),

  // Roll Call Window: 9:30 PM - 10:00 PM
  isWithinWindow: boolean("is_within_window").notNull().default(true), // Was check-in during official time?

  // Additional Info
  notes: text("notes"), // Reason for absence/excuse
  markedBy: varchar("marked_by").references(() => users.id), // Who marked the attendance

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hostelAttendanceRelations = relations(hostelAttendance, ({ one }) => ({
  user: one(users, {
    fields: [hostelAttendance.userId],
    references: [users.id],
  }),
  marker: one(users, {
    fields: [hostelAttendance.markedBy],
    references: [users.id],
  }),
}));

// Zod Schema for Hostel Attendance
export const insertHostelAttendanceSchema = createInsertSchema(hostelAttendance).omit({
  id: true,
  createdAt: true,
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

export type DepartmentRate = typeof departmentRates.$inferSelect;
export type InsertDepartmentRate = z.infer<typeof insertDepartmentRateSchema>;

export type DepartmentPosition = typeof departmentPositions.$inferSelect;
export type InsertDepartmentPosition = z.infer<typeof insertDepartmentPositionSchema>;

export type ElectionPosition = typeof electionPositions.$inferSelect;
export type InsertElectionPosition = z.infer<typeof insertElectionPositionSchema>;

export type Election = typeof elections.$inferSelect;
export type InsertElection = z.infer<typeof insertElectionSchema>;

export type CandidateApplication = typeof candidateApplications.$inferSelect;
export type InsertCandidateApplication = z.infer<typeof insertCandidateApplicationSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

export type Handover = typeof handovers.$inferSelect;
export type InsertHandover = z.infer<typeof insertHandoverSchema>;

export type SignOutApplication = typeof signOutApplications.$inferSelect;
export type InsertSignOutApplication = z.infer<typeof insertSignOutApplicationSchema>;

export type ResidenceChangeRequest = typeof residenceChangeRequests.$inferSelect;
export type InsertResidenceChangeRequest = z.infer<typeof insertResidenceChangeRequestSchema>;

export type WalletWithdrawal = typeof walletWithdrawals.$inferSelect;
export type InsertWalletWithdrawal = z.infer<typeof insertWalletWithdrawalSchema>;

// Hostel Attendance Types (only local attendance tracking - residence data from external API)
export type HostelAttendance = typeof hostelAttendance.$inferSelect;
export type InsertHostelAttendance = z.infer<typeof insertHostelAttendanceSchema>;
