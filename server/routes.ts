import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  users,
  accounts,
  transactions,
  workApplications,
  timecards,
  payments,
  elections,
  candidates,
  votes,
  handovers,
  insertUserSchema,
  insertTransactionSchema,
  insertWorkApplicationSchema,
  insertTimecardSchema,
  insertElectionSchema,
  insertCandidateSchema,
  insertVoteSchema,
  insertHandoverSchema,
} from "@shared/schema";
import {
  generateToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  requireRole,
  revokeToken,
  type AuthRequest,
} from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ AUTHENTICATION ============
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await hashPassword(data.password);

      const [user] = await db
        .insert(users)
        .values({
          ...data,
          password: hashedPassword,
        })
        .returning();

      console.log('User created:', user.id, user.email, user.role);

      const accountNumber = `UEAB${Date.now().toString().slice(-8)}`;
      try {
        await db.insert(accounts).values({
          userId: user.id,
          accountNumber,
          balance: "0.00",
        });
        console.log('Account created for user:', user.id);
      } catch (accountError: any) {
        console.error('Error creating account:', accountError.message);
        throw new Error(`Failed to create account: ${accountError.message}`);
      }

      const token = generateToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          universityId: user.universityId,
        },
        token,
      });
    } catch (error: any) {
      console.error('Registration error:', error.message, error.stack);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          universityId: user.universityId,
        },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.token) {
        revokeToken(req.token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/auth/session", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          universityId: user.universityId,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ CHAPA360 FINANCE ============
  app.get("/api/chapa360/account", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, req.user!.id))
        .limit(1);

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      const recentTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, account.id))
        .orderBy(desc(transactions.createdAt))
        .limit(5);

      const [stats] = await db
        .select({
          totalCredits: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`,
          totalDebits: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`,
          transactionCount: sql<number>`COUNT(*)`,
        })
        .from(transactions)
        .where(eq(transactions.accountId, account.id));

      res.json({
        ...account,
        recentTransactions,
        totalCredits: stats.totalCredits || 0,
        totalDebits: stats.totalDebits || 0,
        transactionCount: stats.transactionCount || 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chapa360/transactions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, req.user!.id))
        .limit(1);

      if (!account) {
        return res.json([]);
      }

      const filter = req.query.filter as string;
      let query = db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, account.id))
        .orderBy(desc(transactions.createdAt));

      if (filter && filter !== "all") {
        query = db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.accountId, account.id),
              eq(transactions.type, filter as "credit" | "debit")
            )
          )
          .orderBy(desc(transactions.createdAt));
      }

      const result = await query;
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ SWSMS WORK STUDY ============
  app.get("/api/swsms/applications", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const apps = await db
        .select()
        .from(workApplications)
        .where(eq(workApplications.userId, req.user!.id))
        .orderBy(desc(workApplications.createdAt));

      res.json(apps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/swsms/applications", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertWorkApplicationSchema.parse(req.body);

      const [application] = await db
        .insert(workApplications)
        .values({
          ...data,
          userId: req.user!.id,
        })
        .returning();

      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/swsms/timecards", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const cards = await db
        .select({
          timecard: timecards,
          application: workApplications,
        })
        .from(timecards)
        .leftJoin(workApplications, eq(timecards.applicationId, workApplications.id))
        .where(eq(timecards.userId, req.user!.id))
        .orderBy(desc(timecards.date));

      const result = cards.map((c) => ({
        ...c.timecard,
        application: c.application,
      }));

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/swsms/timecards", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTimecardSchema.parse(req.body);

      const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const [timecard] = await db
        .insert(timecards)
        .values({
          ...data,
          userId: req.user!.id,
          qrCode,
        })
        .returning();

      res.json(timecard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Chapa360 Accounts
  app.get(
    "/api/admin/chapa360/accounts",
    authMiddleware,
    requireRole("admin", "treasurer"),
    async (req: AuthRequest, res) => {
      try {
        const allAccounts = await db
          .select({
            account: accounts,
            user: users,
          })
          .from(accounts)
          .leftJoin(users, eq(accounts.userId, users.id))
          .orderBy(desc(accounts.createdAt));

        const result = allAccounts.map((a) => ({
          ...a.account,
          user: a.user,
        }));

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Admin: Vetting Dashboard
  app.get(
    "/api/admin/swsms/applications",
    authMiddleware,
    requireRole("admin", "supervisor", "treasurer"),
    async (req: AuthRequest, res) => {
      try {
        const apps = await db
          .select({
            application: workApplications,
            user: users,
          })
          .from(workApplications)
          .leftJoin(users, eq(workApplications.userId, users.id))
          .orderBy(desc(workApplications.createdAt));

        const result = apps.map((a) => ({
          ...a.application,
          user: a.user,
        }));

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Admin: All Timecards
  app.get(
    "/api/admin/swsms/timecards",
    authMiddleware,
    requireRole("admin", "supervisor", "treasurer"),
    async (req: AuthRequest, res) => {
      try {
        const cards = await db
          .select({
            timecard: timecards,
            user: users,
            application: workApplications,
          })
          .from(timecards)
          .leftJoin(users, eq(timecards.userId, users.id))
          .leftJoin(workApplications, eq(timecards.applicationId, workApplications.id))
          .orderBy(desc(timecards.date));

        const result = cards.map((c) => ({
          ...c.timecard,
          user: c.user,
          application: c.application,
        }));

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.patch(
    "/api/swsms/timecards/:id/verify",
    authMiddleware,
    requireRole("admin", "supervisor", "treasurer"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        const [updated] = await db
          .update(timecards)
          .set({
            status,
            verifiedBy: req.user!.id,
          })
          .where(eq(timecards.id, id))
          .returning();

        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin: Elections Management
  app.get(
    "/api/admin/sgms/elections",
    authMiddleware,
    requireRole("admin", "vc"),
    async (req: AuthRequest, res) => {
      try {
        const allElections = await db
          .select()
          .from(elections)
          .orderBy(desc(elections.startDate));

        const result = await Promise.all(
          allElections.map(async (election) => {
            const [candidateCount] = await db
              .select({
                count: sql<number>`COUNT(*)`,
              })
              .from(candidates)
              .where(eq(candidates.electionId, election.id));

            const [voteCount] = await db
              .select({
                count: sql<number>`COUNT(*)`,
              })
              .from(votes)
              .where(eq(votes.electionId, election.id));

            return {
              ...election,
              candidateCount: candidateCount?.count || 0,
              totalVotes: voteCount?.count || 0,
            };
          })
        );

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.post(
    "/api/sgms/elections",
    authMiddleware,
    requireRole("admin", "vc"),
    async (req: AuthRequest, res) => {
      try {
        const data = insertElectionSchema.parse(req.body);

        const [election] = await db
          .insert(elections)
          .values(data)
          .returning();

        res.json(election);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.patch(
    "/api/swsms/applications/:id/review",
    authMiddleware,
    requireRole("admin", "supervisor", "treasurer"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const [updated] = await db
          .update(workApplications)
          .set({
            status,
            reviewNotes: notes,
            reviewedBy: req.user!.id,
            updatedAt: new Date(),
          })
          .where(eq(workApplications.id, id))
          .returning();

        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // ============ SGMS GOVERNANCE ============
  app.get("/api/sgms/elections", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const allElections = await db
        .select()
        .from(elections)
        .orderBy(desc(elections.startDate));

      const result = await Promise.all(
        allElections.map(async (election) => {
          const electionCandidates = await db
            .select({
              candidate: candidates,
              user: users,
            })
            .from(candidates)
            .leftJoin(users, eq(candidates.userId, users.id))
            .where(eq(candidates.electionId, election.id));

          const candidatesWithVotes = await Promise.all(
            electionCandidates.map(async (c) => {
              const [voteData] = await db
                .select({
                  voteCount: sql<number>`COUNT(*)`,
                })
                .from(votes)
                .where(eq(votes.candidateId, c.candidate.id));

              const [hasVoted] = await db
                .select()
                .from(votes)
                .where(
                  and(
                    eq(votes.candidateId, c.candidate.id),
                    eq(votes.voterId, req.user!.id)
                  )
                )
                .limit(1);

              const totalVotes = await db
                .select({
                  total: sql<number>`COUNT(*)`,
                })
                .from(votes)
                .where(eq(votes.electionId, election.id));

              const votePercentage =
                totalVotes[0]?.total > 0
                  ? Math.round(((voteData?.voteCount || 0) / totalVotes[0].total) * 100)
                  : 0;

              return {
                ...c.candidate,
                user: c.user,
                voteCount: voteData?.voteCount || 0,
                votePercentage,
                hasVoted: !!hasVoted,
              };
            })
          );

          return {
            ...election,
            candidates: candidatesWithVotes,
          };
        })
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sgms/vote", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { electionId, candidateId } = req.body;

      const [existingVote] = await db
        .select()
        .from(votes)
        .where(
          and(
            eq(votes.electionId, electionId),
            eq(votes.voterId, req.user!.id)
          )
        )
        .limit(1);

      if (existingVote) {
        return res.status(400).json({ error: "You have already voted in this election" });
      }

      const [vote] = await db
        .insert(votes)
        .values({
          electionId,
          candidateId,
          voterId: req.user!.id,
        })
        .returning();

      res.json(vote);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/sgms/handovers", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const allHandovers = await db
        .select({
          handover: handovers,
          fromUser: users,
        })
        .from(handovers)
        .leftJoin(users, eq(handovers.fromUserId, users.id))
        .orderBy(desc(handovers.createdAt));

      const result = allHandovers.map((h) => ({
        ...h.handover,
        fromUser: h.fromUser,
      }));

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sgms/handovers", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertHandoverSchema.parse(req.body);

      const [handover] = await db
        .insert(handovers)
        .values({
          ...data,
          fromUserId: req.user!.id,
        })
        .returning();

      res.json(handover);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch(
    "/api/sgms/handovers/:id/complete",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        const [updated] = await db
          .update(handovers)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(handovers.id, id))
          .returning();

        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // ============ ANALYTICS ============
  app.get("/api/analytics/overview", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = {
        balanceTrend: Math.floor(Math.random() * 20) - 5,
        applicationsTrend: Math.floor(Math.random() * 15),
        totalEarnings: Math.floor(Math.random() * 50000),
        earningsTrend: Math.floor(Math.random() * 25),
      };
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/financial", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = [
        { month: "Jan", balance: 15000 },
        { month: "Feb", balance: 18500 },
        { month: "Mar", balance: 22000 },
        { month: "Apr", balance: 25500 },
        { month: "May", balance: 28000 },
        { month: "Jun", balance: 31500 },
      ];
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/work-study", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = [
        { week: "Week 1", hours: 12 },
        { week: "Week 2", hours: 15 },
        { week: "Week 3", hours: 18 },
        { week: "Week 4", hours: 14 },
      ];
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/governance", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = [
        { election: "2023 Fall", candidates: 8, votes: 450 },
        { election: "2024 Spring", candidates: 12, votes: 520 },
        { election: "2024 Fall", candidates: 10, votes: 480 },
      ];
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
