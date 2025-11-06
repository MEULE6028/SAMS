import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { eq, and, desc, sql, count, inArray, gte, lte } from "drizzle-orm";
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
  signOutApplications,
  residenceChangeRequests,
  walletWithdrawals,
  hostelAttendance, // Only keeping attendance - residence data from external API
  insertUserSchema,
  insertTransactionSchema,
  insertWorkApplicationSchema,
  insertTimecardSchema,
  insertElectionSchema,
  insertCandidateSchema,
  insertVoteSchema,
  insertHandoverSchema,
  insertSignOutApplicationSchema,
  insertResidenceChangeRequestSchema,
  insertWalletWithdrawalSchema,
  insertHostelAttendanceSchema, // Only attendance - residence data from external API
} from "@shared/schema";
import {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
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
          // Use universityId as studentId if not provided (for external API integration)
          studentId: data.studentId || data.universityId,
        })
        .returning();

      console.log('User created:', user.id, user.email, user.role, 'studentId:', user.studentId);

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

      // issue tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          universityId: user.universityId,
        },
        token: accessToken,
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

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          universityId: user.universityId,
        },
        token: accessToken,
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
      clearRefreshTokenCookie(res);
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Refresh endpoint
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) return res.status(401).json({ error: "No refresh token" });

      const payload = (await import("./auth")).verifyToken(token);
      if (!payload || payload.type !== "refresh") {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      // Minimal user object for signing; you may fetch from DB if needed
      const user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      } as any;

      const newAccess = generateAccessToken(user);
      const newRefresh = generateRefreshToken(user);
      setRefreshTokenCookie(res, newRefresh);

      res.json({ token: newAccess });
    } catch (error: any) {
      clearRefreshTokenCookie(res);
      res.status(401).json({ error: "Failed to refresh token" });
    }
  });

  // Protect all subsequent API routes (except /api/auth/* and admin endpoints)
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth")) return next();
    if (req.path.startsWith("/admin/")) return next(); // Allow all admin endpoints without auth
    return (authMiddleware as any)(req, res, next);
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

  // ============ STUDENT DASHBOARD APIs ============

  // Get student profile (can integrate with external API here)
  app.get("/api/student/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // TODO: Integrate with external API using user.universityId
      // const externalData = await fetchFromExternalAPI(user.universityId);

      res.json({
        id: user.id,
        name: user.fullName,
        universityId: user.universityId,
        email: user.email,
        profile: {
          year: 3, // TODO: Fetch from external API
          semester: 1,
          major: "Computer Science",
          gpa: "3.75",
        },
        residence: {
          hostelName: "Block A",
          roomNumber: "A101",
          bedNumber: "1",
        }
      });
    } catch (error: any) {
      console.error("Error fetching student profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get wallet info
  app.get("/api/student/wallet", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1);

      if (!account) {
        return res.json({
          balance: "0.00",
          accountNumber: null,
          recentTransactions: [],
        });
      }

      const recentTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, account.id))
        .orderBy(desc(transactions.createdAt))
        .limit(5);

      res.json({
        balance: account.balance,
        accountNumber: account.accountNumber,
        recentTransactions,
      });
    } catch (error: any) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit withdrawal request
  app.post("/api/student/wallet/withdraw", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { amount, method, destination } = req.body;

      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1);

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      const balance = parseFloat(account.balance);
      const withdrawAmount = parseFloat(amount);

      if (withdrawAmount > balance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const [withdrawal] = await db
        .insert(walletWithdrawals)
        .values({
          accountId: account.id,
          amount: amount.toString(),
          method,
          destination,
          status: "pending",
        })
        .returning();

      res.json({ success: true, withdrawal });
    } catch (error: any) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get wallet transactions
  app.get("/api/student/wallet/transactions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1);

      if (!account) {
        return res.json({ transactions: [] });
      }

      const txns = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, account.id))
        .orderBy(desc(transactions.createdAt));

      res.json({ transactions: txns });
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get wallet withdrawals
  app.get("/api/student/wallet/withdrawals", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1);

      if (!account) {
        return res.json({ withdrawals: [] });
      }

      const wdls = await db
        .select()
        .from(walletWithdrawals)
        .where(eq(walletWithdrawals.accountId, account.id))
        .orderBy(desc(walletWithdrawals.createdAt));

      res.json({ withdrawals: wdls });
    } catch (error: any) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========================
  // APPOINTMENTS API - Student-specific appointment endpoints
  // ========================

  const EXTERNAL_API_URL = process.env.VITE_STUDENT_API_URL || 'https://studedatademo.azurewebsites.net';

  // Get student appointments with attendance data
  app.get("/api/appointments/student/:studentId/with-attendance", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { studentId } = req.params;

      // Disable caching for this endpoint
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`\n=== [APPOINTMENTS API] ===`);
      console.log(`Student ID: ${studentId}`);
      console.log(`[EXTERNAL API] Fetching appointments with attendance from: ${EXTERNAL_API_URL}/api/appointments/student/${studentId}/with-attendance`);

      // Use the optimized endpoint that returns appointments with attendance in one call
      const response = await fetch(`${EXTERNAL_API_URL}/api/appointments/student/${studentId}/with-attendance`);

      if (!response.ok) {
        console.error(`[EXTERNAL API ERROR] Status: ${response.status}`);
        throw new Error(`Failed to fetch appointments from external API: ${response.status}`);
      }

      const appointmentsWithAttendance = await response.json();
      console.log(`[EXTERNAL API] Received ${appointmentsWithAttendance.length} appointments with attendance data`);
      console.log(`[EXTERNAL API] Sample appointment:`, appointmentsWithAttendance[0]);

      // Transform to match frontend expectations
      const transformedAppointments = appointmentsWithAttendance.map((apt: any) => ({
        id: apt.id,
        studentId: studentId,
        title: apt.title,
        description: apt.description || '',
        date: apt.date,
        venue: apt.venue,
        appointmentType: apt.appointmentType,
        attendanceStatus: apt.attendanceStatus || null, // "present", "absent", "excused", or null
        mandatory: apt.mandatory,
      }));

      console.log(`[APPOINTMENTS API] Transformed ${transformedAppointments.length} appointments`);
      console.log(`[APPOINTMENTS API] Breakdown by type:`, {
        church: transformedAppointments.filter((a: any) => a.appointmentType === 'church').length,
        assembly: transformedAppointments.filter((a: any) => a.appointmentType === 'assembly').length,
        other: transformedAppointments.filter((a: any) => !['church', 'assembly'].includes(a.appointmentType)).length
      });
      console.log(`[APPOINTMENTS API] Attendance status:`, {
        present: transformedAppointments.filter((a: any) => a.attendanceStatus === 'present').length,
        absent: transformedAppointments.filter((a: any) => a.attendanceStatus === 'absent').length,
        excused: transformedAppointments.filter((a: any) => a.attendanceStatus === 'excused').length,
        notMarked: transformedAppointments.filter((a: any) => a.attendanceStatus === null).length
      });
      console.log(`=== [END APPOINTMENTS API] ===\n`);

      res.json(transformedAppointments);
    } catch (error: any) {
      console.error('[APPOINTMENTS API ERROR]', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get attendance summary for student - uses comprehensive /summary endpoint
  app.get("/api/appointments/attendance/student/:studentId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { studentId } = req.params;

      // Disable caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`[EXTERNAL API] Fetching summary from: ${EXTERNAL_API_URL}/api/appointments/student/${studentId}/summary`);

      try {
        // Use the comprehensive /summary endpoint which includes breakdown
        const summaryResponse = await fetch(`${EXTERNAL_API_URL}/api/appointments/student/${studentId}/summary`);

        if (!summaryResponse.ok) {
          throw new Error('Failed to fetch attendance summary');
        }

        const fullSummary = await summaryResponse.json();
        console.log(`[EXTERNAL API] Received summary with ${fullSummary.totalAppointments} total appointments`);

        // Return the full summary (frontend can use what it needs)
        res.json(fullSummary);
      } catch (error) {
        // If external API fails, return empty summary
        console.error('Failed to fetch from external API:', error);
        res.json({
          studentId: studentId,
          studentName: '',
          totalAppointments: 0,
          attended: 0,
          absent: 0,
          excused: 0,
          attendanceRate: 0,
          breakdown: {
            church: { total: 0, attended: 0, absent: 0, excused: 0, attendanceRate: 0 },
            assembly: { total: 0, attended: 0, absent: 0, excused: 0, attendanceRate: 0 }
          },
          upcomingCount: 0
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get missed appointments breakdown - simplified to use /summary endpoint
  app.get("/api/appointments/student/:studentId/missed", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { studentId } = req.params;

      // Disable caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`[EXTERNAL API] Fetching missed from: ${EXTERNAL_API_URL}/api/appointments/student/${studentId}/missed`);

      try {
        // Use the external API's /missed endpoint which has all the stats
        const missedResponse = await fetch(`${EXTERNAL_API_URL}/api/appointments/student/${studentId}/missed`);

        if (!missedResponse.ok) {
          throw new Error('Failed to fetch missed appointments');
        }

        const missedData = await missedResponse.json();
        console.log(`[EXTERNAL API] Received missed breakdown for ${missedData.studentName}`);

        // Return the breakdown (church and assembly)
        res.json(missedData);
      } catch (error) {
        // If external API fails, return empty breakdown
        console.error('Failed to fetch from external API:', error);
        res.json({
          studentId: studentId,
          studentName: '',
          church: { total: 0, attended: 0, missed: 0, absent: 0, excused: 0, missedRate: 0 },
          assembly: { total: 0, attended: 0, missed: 0, absent: 0, excused: 0, missedRate: 0 }
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark attendance for an appointment
  app.post("/api/appointments/:appointmentId/attendance", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { appointmentId } = req.params;
      const { attended, notes } = req.body;

      // Mock attendance marking - Replace with actual database update
      const result = {
        success: true,
        appointmentId: parseInt(appointmentId),
        attended: attended,
        markedAt: new Date(),
        markedBy: req.user?.id,
        notes: notes || "",
      };

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Legacy endpoint (kept for backward compatibility)
  app.get("/api/student/appointments", authMiddleware, async (req: AuthRequest, res) => {
    try {
      // TODO: Fetch from external API
      const mockAppointments = [
        {
          id: 1,
          title: "Chapel Service",
          appointmentDate: new Date("2025-11-03T08:00:00"),
          status: "scheduled",
        },
        {
          id: 2,
          title: "Career Fair",
          appointmentDate: new Date("2025-11-10T14:00:00"),
          status: "scheduled",
        },
      ];

      res.json(mockAppointments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get work study status
  app.get("/api/student/work-status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      // Get user to fetch studentId for external API
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user?.studentId) {
        return res.json({ enrolled: false });
      }

      // Check external API for work study status
      const externalApiUrl = process.env.STUDENT_API_URL || 'https://studedatademo.azurewebsites.net';
      let externalWorkStudy = false;

      try {
        const response = await fetch(`${externalApiUrl}/api/students/by-student-id/${user.studentId}`);
        if (response.ok) {
          const externalData = await response.json();
          externalWorkStudy = externalData.workStudy === true;
        }
      } catch (error) {
        console.error('Error fetching external work study status:', error);
      }

      // Get internal work application
      const [application] = await db
        .select()
        .from(workApplications)
        .where(eq(workApplications.userId, userId))
        .orderBy(desc(workApplications.createdAt))
        .limit(1);

      console.log('[WORK STATUS] User:', userId);
      console.log('[WORK STATUS] External work study:', externalWorkStudy);
      console.log('[WORK STATUS] Application found:', !!application);
      if (application) {
        console.log('[WORK STATUS] Application details:', {
          position: application.position,
          department: application.department,
          hoursPerWeek: application.hoursPerWeek,
          status: application.status
        });
      }

      // If external API says student is in work study, show enrolled status
      if (externalWorkStudy) {
        const hours = await db
          .select()
          .from(timecards)
          .where(eq(timecards.userId, userId));

        const totalHours = hours.reduce((sum, card) => sum + parseFloat(card.hoursWorked), 0);

        // Calculate total earnings from verified timecards
        const totalEarnings = hours
          .filter(card => card.status === 'verified' && card.earnings)
          .reduce((sum, card) => sum + parseFloat(card.earnings || '0'), 0);

        // Get hourly rate based on department
        const { getDepartmentRate } = await import('./departmentRates');
        const hourlyRate = application?.department ? await getDepartmentRate(application.department) : 0;

        return res.json({
          enrolled: true,
          position: application?.position || "Work Study Student",
          department: application?.department || "Assigned Department",
          hoursPerWeek: application?.hoursPerWeek || 0,
          hourlyRate: hourlyRate,
          status: application?.status || "approved",
          totalHours,
          totalEarnings,
          hoursThisWeek: 0, // TODO: Calculate current week hours
        });
      }

      // Otherwise check if they have an application
      if (!application) {
        return res.json({ enrolled: false });
      }

      const hours = await db
        .select()
        .from(timecards)
        .where(eq(timecards.userId, userId));

      const totalHours = hours.reduce((sum, card) => sum + parseFloat(card.hoursWorked), 0);

      const totalEarnings = hours
        .filter(card => card.status === 'verified' && card.earnings)
        .reduce((sum, card) => sum + parseFloat(card.earnings || '0'), 0);

      // Get hourly rate based on department
      const { getDepartmentRate } = await import('./departmentRates');
      const hourlyRate = await getDepartmentRate(application.department);

      res.json({
        enrolled: true,
        position: application.position || "Work Study Student",
        department: application.department || "Assigned Department",
        hoursPerWeek: application.hoursPerWeek || 0,
        hourlyRate: hourlyRate,
        status: application.status,
        totalHours,
        totalEarnings,
        hoursThisWeek: 0, // TODO: Calculate current week hours
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get sign-out application count
  app.get("/api/student/sign-out-count", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      // Count applications in current semester (mock - should check actual semester dates)
      const applications = await db
        .select()
        .from(signOutApplications)
        .where(eq(signOutApplications.userId, userId));

      res.json({ count: applications.length, limit: 4 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get sign-out application history
  app.get("/api/student/sign-out-history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      const applications = await db
        .select()
        .from(signOutApplications)
        .where(eq(signOutApplications.userId, userId))
        .orderBy(desc(signOutApplications.submittedAt || signOutApplications.createdAt));

      res.json({ signOuts: applications });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit sign-out application
  app.post("/api/student/sign-out", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const {
        roomNumber,
        destination,
        meansOfTravel,
        purposeOfTravel,
        leaveType,
        leaveTypeOther,
        startDate,
        endDate,
        contactDuringAbsence,
        emergencyContact,
        emergencyPhone,
        missedClasses,
        parentApproval,
        // Legacy fields for backward compatibility
        reason,
        contact
      } = req.body;

      // Check if user has reached limit
      const existingApps = await db
        .select()
        .from(signOutApplications)
        .where(eq(signOutApplications.userId, userId));

      if (existingApps.length >= 4) {
        return res.status(400).json({ error: "Maximum 4 applications per semester" });
      }

      // Validate 3-day advance requirement
      const departureDate = new Date(startDate);
      const submissionDate = new Date();
      const daysInAdvance = Math.floor((departureDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysInAdvance < 3) {
        return res.status(400).json({
          error: "Sign-out requests must be submitted at least 3 days before intended departure"
        });
      }

      const [application] = await db
        .insert(signOutApplications)
        .values({
          userId,
          roomNumber: roomNumber || null,
          destination: destination,
          meansOfTravel: meansOfTravel || "Not Specified",
          purposeOfTravel: purposeOfTravel || reason || "Not Specified",
          leaveType: leaveType || "other",
          leaveTypeOther: leaveTypeOther || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          contactDuringAbsence: contactDuringAbsence || contact || "",
          emergencyContact: emergencyContact || "",
          emergencyPhone: emergencyPhone || "",
          missedClasses: missedClasses ? JSON.stringify(missedClasses) : null,
          parentApproval: parentApproval === true,
          // Legacy field for compatibility
          reason: reason || purposeOfTravel,
          // Initial status and approval levels
          status: "pending",
          dormDeanApproval: "pending",
          deanOfStudentsApproval: "pending",
          registrarApproval: "pending",
          semesterCount: existingApps.length + 1,
        })
        .returning();

      res.json({ success: true, application });
    } catch (error: any) {
      console.error("Error submitting sign-out:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit residence change request
  app.post("/api/student/residence/change", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { currentType, requestedType, reason, preferredHostel } = req.body;

      const [request] = await db
        .insert(residenceChangeRequests)
        .values({
          userId,
          currentResidenceType: currentType,
          requestedResidenceType: requestedType,
          reason,
          preferredHostelId: preferredHostel ? parseInt(preferredHostel) : null,
          status: "pending",
        })
        .returning();

      res.json({ success: true, request });
    } catch (error: any) {
      console.error("Error submitting residence change:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ELECTIONS ============
  // Get active elections
  app.get("/api/elections/active", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const activeElections = await db
        .select()
        .from(elections)
        .where(eq(elections.status, "active"))
        .orderBy(elections.startDate);

      res.json({ elections: activeElections });
    } catch (error: any) {
      console.error("Error fetching elections:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get candidates for an election
  app.get("/api/elections/:electionId/candidates", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { electionId } = req.params;
      const userId = req.user!.id;
      const studentId = req.user!.studentId;

      // Get all candidates with their positions
      const electionCandidates = await db
        .select({
          id: candidates.id,
          position: candidates.position,
          positionId: candidates.positionId,
          manifesto: candidates.manifesto,
          qualifications: candidates.qualifications,
          visionStatement: candidates.visionStatement,
          photoUrl: candidates.photoUrl,
          status: candidates.status,
          createdAt: candidates.createdAt,
          user: {
            id: users.id,
            fullName: users.fullName,
            email: users.email,
          },
        })
        .from(candidates)
        .innerJoin(users, eq(candidates.userId, users.id))
        .where(eq(candidates.electionId, electionId))
        .orderBy(candidates.position);

      // If student ID available, filter candidates by voter eligibility
      if (studentId) {
        try {
          const externalAPIResponse = await fetch(`http://localhost:3001/api/students/${studentId}`);
          if (externalAPIResponse.ok) {
            const studentData = await externalAPIResponse.json();
            const { checkVoterEligibility } = await import('./electionEligibility');

            // Filter candidates by eligibility
            const eligibleCandidates = [];
            for (const candidate of electionCandidates) {
              if (candidate.positionId) {
                const eligibilityResult = await checkVoterEligibility(candidate.positionId, studentData);
                if (eligibilityResult.eligible) {
                  eligibleCandidates.push(candidate);
                }
              } else {
                // If no position ID, include by default (backward compatibility)
                eligibleCandidates.push(candidate);
              }
            }

            return res.json({ candidates: eligibleCandidates });
          }
        } catch (apiError) {
          console.error("Error checking eligibility:", apiError);
          // If eligibility check fails, return all candidates
        }
      }

      // Return all candidates if no filtering applied
      res.json({ candidates: electionCandidates });
    } catch (error: any) {
      console.error("Error fetching candidates:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check if user has voted in an election
  app.get("/api/elections/:electionId/has-voted", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { electionId } = req.params;
      const userId = req.user!.id;

      const userVotes = await db
        .select()
        .from(votes)
        .where(
          and(
            eq(votes.electionId, electionId),
            eq(votes.voterId, userId)
          )
        );

      // Return hasVoted status, candidate IDs, and position IDs
      res.json({
        hasVoted: userVotes.length > 0,
        votedCandidateIds: userVotes.map(v => v.candidateId),
        votedPositionIds: userVotes.map(v => v.positionId).filter(Boolean) // Filter out nulls
      });
    } catch (error: any) {
      console.error("Error checking vote status:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit a vote
  app.post("/api/elections/vote", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { electionId, candidateId } = req.body;

      // Prevent admins from voting
      if (req.user!.role === "admin" || req.user!.role === "vc") {
        return res.status(403).json({ error: "Admins cannot vote in elections" });
      }

      // Get the candidate with position information
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, candidateId))
        .limit(1);

      if (!candidate || candidate.status !== "approved") {
        return res.status(400).json({ error: "Invalid candidate" });
      }

      const positionId = candidate.positionId;

      // Check if already voted for this position in this election
      if (positionId) {
        const existingPositionVote = await db
          .select()
          .from(votes)
          .where(
            and(
              eq(votes.electionId, electionId),
              eq(votes.positionId, positionId),
              eq(votes.voterId, userId)
            )
          )
          .limit(1);

        if (existingPositionVote.length > 0) {
          return res.status(400).json({ error: "You have already voted for this position" });
        }
      }

      // Get student data from external API for eligibility check
      const studentId = req.user!.studentId;
      if (!studentId) {
        return res.status(400).json({ error: "Student ID not found" });
      }

      try {
        const externalAPIResponse = await fetch(`http://localhost:3001/api/students/${studentId}`);
        if (!externalAPIResponse.ok) {
          return res.status(400).json({ error: "Could not verify student information" });
        }
        const studentData = await externalAPIResponse.json();

        // Check voter eligibility for this position
        if (positionId) {
          const { checkVoterEligibility } = await import('./electionEligibility');
          const eligibilityResult = await checkVoterEligibility(positionId, studentData);

          if (!eligibilityResult.eligible) {
            return res.status(403).json({
              error: eligibilityResult.reason || "You are not eligible to vote for this position",
              restrictions: eligibilityResult.restrictions
            });
          }
        }
      } catch (apiError) {
        console.error("Error checking eligibility:", apiError);
        return res.status(500).json({ error: "Could not verify voter eligibility" });
      }

      // Record vote with position_id
      const [vote] = await db
        .insert(votes)
        .values({
          electionId,
          candidateId,
          positionId: positionId || null,
          voterId: userId,
        })
        .returning();

      res.json({ success: true, vote });
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Apply as candidate
  app.post("/api/elections/apply", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { electionId, position, manifesto, qualifications, visionStatement, photoUrl } = req.body;

      // Check if already applied for this election
      const existingApplication = await db
        .select()
        .from(candidates)
        .where(
          and(
            eq(candidates.electionId, electionId),
            eq(candidates.userId, userId)
          )
        )
        .limit(1);

      if (existingApplication.length > 0) {
        return res.status(400).json({ error: "You have already applied for this election" });
      }

      // Create candidate application
      const [candidate] = await db
        .insert(candidates)
        .values({
          electionId,
          userId,
          position,
          manifesto,
          qualifications: qualifications || null,
          visionStatement: visionStatement || null,
          photoUrl: photoUrl || null,
          status: "pending",
        })
        .returning();

      res.json({ success: true, candidate });
    } catch (error: any) {
      console.error("Error submitting application:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get election results
  app.get("/api/elections/:electionId/results", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { electionId } = req.params;

      // Get vote counts per candidate
      const results = await db
        .select({
          candidateId: votes.candidateId,
          voteCount: count(votes.id),
        })
        .from(votes)
        .where(eq(votes.electionId, electionId))
        .groupBy(votes.candidateId);

      // Get candidate details
      const candidateIds = results.map(r => r.candidateId);
      const candidateDetails = await db
        .select({
          id: candidates.id,
          position: candidates.position,
          user: {
            fullName: users.fullName,
          },
        })
        .from(candidates)
        .innerJoin(users, eq(candidates.userId, users.id))
        .where(inArray(candidates.id, candidateIds));

      // Merge results with candidate details
      const formattedResults = results.map(result => {
        const candidate = candidateDetails.find(c => c.id === result.candidateId);
        return {
          ...result,
          candidate,
        };
      });

      res.json({ results: formattedResults });
    } catch (error: any) {
      console.error("Error fetching results:", error);
      res.status(500).json({ error: error.message });
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

      res.json({ applications: apps });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/swsms/applications", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertWorkApplicationSchema.parse(req.body);

      // Step 1: Get student data from external API for eligibility checks
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user!.id),
      });

      if (!user?.studentId) {
        return res.status(400).json({
          error: "Student ID not found. Please complete your profile first."
        });
      }

      // Fetch external student data
      let studentData;
      try {
        const externalResponse = await fetch(
          `https://studedatademo.azurewebsites.net/api/students/by-student-id/${user.studentId}`
        );

        if (!externalResponse.ok) {
          throw new Error("Could not fetch student data from external system");
        }

        studentData = await externalResponse.json();
      } catch (fetchError: any) {
        return res.status(500).json({
          error: "Unable to verify eligibility. Please try again later.",
          details: fetchError.message
        });
      }

      // Step 2: Run automated eligibility checks (NEW CRITERIA)
      const {
        checkWorkStudyEligibility,
        formatEligibilityDetails,
        determineApplicationStatus
      } = await import('./eligibility');

      const { generateApplicationId, formatAcademicSemester } = await import('./workStudyUtils');

      const eligibilityResult = await checkWorkStudyEligibility(studentData, {
        registeredUnitsHours: data.registeredUnitsHours,
      });

      const newStatus = determineApplicationStatus(eligibilityResult);
      const applicationId = generateApplicationId();

      // Step 3: Create application with eligibility results
      const [application] = await db
        .insert(workApplications)
        .values({
          ...data,
          academicSemester: formatAcademicSemester(new Date()),
          applicationId, // e.g., WS-2025-A1B2C
          userId: req.user!.id,
          status: newStatus as "pending" | "under_review" | "auto_rejected" | "appealed" | "supervisor_review" | "approved" | "rejected",
          submittedAt: new Date(),

          // Store eligibility check results
          eligibilityChecked: true,
          eligibilityPassed: eligibilityResult.passed,
          eligibilityDetails: formatEligibilityDetails(eligibilityResult),

          // Store specific check values (updated for new criteria)
          feeBalanceAtSubmission: studentData.balance?.toString(),
          feeBalanceEligible: eligibilityResult.checks.feeBalance.passed,
          isRegisteredCurrentSemester: eligibilityResult.checks.semesterCompletion.passed,
        })
        .returning();

      // Step 4: Return application with eligibility info
      res.json({
        application,
        eligibility: {
          passed: eligibilityResult.passed,
          message: eligibilityResult.overallMessage,
          canAppeal: !eligibilityResult.passed, // Can appeal if auto-rejected
          checks: eligibilityResult.checks,
        },
      });
    } catch (error: any) {
      console.error("Work study application error:", error);
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

      res.json({ timeCards: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/swsms/timecards", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTimecardSchema.parse(req.body);

      // Get the application to find the department and weekly allocation
      const [application] = await db
        .select()
        .from(workApplications)
        .where(eq(workApplications.id, data.applicationId));

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Determine week range (Sunday-Saturday) for the submitted date
      const submittedDate = new Date(data.date);
      const submittedDay = submittedDate.getDay(); // 0 = Sunday
      const weekStart = new Date(submittedDate);
      weekStart.setDate(submittedDate.getDate() - submittedDay);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Sum existing hours for this user & application within the week
      const existing = await db
        .select({ hours: timecards.hoursWorked })
        .from(timecards)
        .where(
          and(
            eq(timecards.userId, req.user!.id),
            eq(timecards.applicationId, data.applicationId),
            gte(timecards.date, weekStart),
            lte(timecards.date, weekEnd)
          )
        );

      const existingHours = existing.reduce((sum: number, r: any) => sum + parseFloat(String(r.hours || 0)), 0);
      const incomingHours = parseFloat(String(data.hoursWorked || 0));
      const totalPlanned = existingHours + incomingHours;

      const weeklyLimit = Number(application.hoursPerWeek || 0);
      if (weeklyLimit > 0 && totalPlanned > weeklyLimit) {
        return res.status(400).json({ error: `Weekly hours limit exceeded. Allocated: ${weeklyLimit} hrs; existing this week: ${existingHours} hrs; attempted add: ${incomingHours} hrs` });
      }

      // Get department rate
      const { getDepartmentRate } = await import('./departmentRates');
      const hourlyRate = await getDepartmentRate(application.department);

      const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const [timecard] = await db
        .insert(timecards)
        .values({
          ...data,
          userId: req.user!.id,
          hourlyRate: hourlyRate.toString(),
          qrCode,
          // Earnings will be calculated when supervisor verifies
        })
        .returning();

      res.json(timecard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Department Rates Management
  app.get("/api/swsms/department-rates", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { getAllDepartmentRates } = await import('./departmentRates');
      const rates = await getAllDepartmentRates();
      res.json({ rates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/swsms/department-rates",
    authMiddleware,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { department, description, hourlyRate, positions } = req.body;

        if (!department || !hourlyRate) {
          return res.status(400).json({ error: "Department name and hourly rate are required" });
        }

        const rate = parseFloat(hourlyRate);
        if (isNaN(rate) || rate <= 0) {
          return res.status(400).json({ error: "Invalid hourly rate" });
        }

        const { createDepartment, addDepartmentPosition } = await import('./departmentRates');
        const newDepartment = await createDepartment(
          { department, description, hourlyRate: rate },
          req.user!.id
        );

        // Add positions if provided
        if (positions && Array.isArray(positions)) {
          for (const pos of positions) {
            if (pos.position) {
              await addDepartmentPosition(
                newDepartment.id,
                pos.position,
                pos.description
              );
            }
          }
        }

        res.json({
          message: "Department created successfully",
          department: newDepartment,
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.put(
    "/api/swsms/department-rates/:department",
    authMiddleware,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { department } = req.params;
        const { hourlyRate } = req.body;

        if (!department || !hourlyRate) {
          return res.status(400).json({ error: "Department and hourly rate are required" });
        }

        const rate = parseFloat(hourlyRate);
        if (isNaN(rate) || rate <= 0) {
          return res.status(400).json({ error: "Invalid hourly rate" });
        }

        const { updateDepartmentRate } = await import('./departmentRates');
        const updated = await updateDepartmentRate(department, rate, req.user!.id);

        res.json({
          message: "Department rate updated successfully",
          rate: updated,
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.post(
    "/api/swsms/departments/:departmentId/positions",
    authMiddleware,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { departmentId } = req.params;
        const { position, description } = req.body;

        if (!position) {
          return res.status(400).json({ error: "Position name is required" });
        }

        const { addDepartmentPosition } = await import('./departmentRates');
        const newPosition = await addDepartmentPosition(departmentId, position, description);

        res.json({
          message: "Position added successfully",
          position: newPosition,
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.delete(
    "/api/swsms/departments/:departmentId",
    authMiddleware,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { departmentId } = req.params;
        const { deleteDepartment } = await import('./departmentRates');
        await deleteDepartment(departmentId);
        res.json({ message: "Department deleted successfully" });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.delete(
    "/api/swsms/positions/:positionId",
    authMiddleware,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { positionId } = req.params;
        const { deletePosition } = await import('./departmentRates');
        await deletePosition(positionId);
        res.json({ message: "Position deleted successfully" });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

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

        // Get the timecard to calculate earnings
        const [existingTimecard] = await db
          .select()
          .from(timecards)
          .where(eq(timecards.id, id));

        if (!existingTimecard) {
          return res.status(404).json({ error: "Timecard not found" });
        }

        // Calculate earnings when verified
        let earnings = null;
        if (status === "verified" && existingTimecard.hoursWorked && existingTimecard.hourlyRate) {
          earnings = parseFloat(existingTimecard.hoursWorked) * parseFloat(existingTimecard.hourlyRate);
        }

        const [updated] = await db
          .update(timecards)
          .set({
            status,
            verifiedBy: req.user!.id,
            ...(earnings !== null && { earnings: earnings.toString() }),
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

  // Update election (admin only)
  app.put(
    "/api/admin/sgms/elections/:id",
    authMiddleware,
    requireRole("admin", "vc"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const data = insertElectionSchema.partial().parse(req.body);

        const [updated] = await db
          .update(elections)
          .set(data)
          .where(eq(elections.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: "Election not found" });
        }

        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Delete election (admin only)
  app.delete(
    "/api/admin/sgms/elections/:id",
    authMiddleware,
    requireRole("admin", "vc"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        // Delete related votes first
        await db.delete(votes).where(eq(votes.electionId, id));

        // Delete related candidates
        await db.delete(candidates).where(eq(candidates.electionId, id));

        // Delete election
        const [deleted] = await db
          .delete(elections)
          .where(eq(elections.id, id))
          .returning();

        if (!deleted) {
          return res.status(404).json({ error: "Election not found" });
        }

        res.json({ success: true, message: "Election deleted successfully" });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Get candidates for an election (admin)
  app.get(
    "/api/admin/sgms/elections/:id/candidates",
    authMiddleware,
    requireRole("admin", "vc"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        const allCandidates = await db
          .select({
            candidate: candidates,
            user: users,
          })
          .from(candidates)
          .leftJoin(users, eq(candidates.userId, users.id))
          .where(eq(candidates.electionId, id))
          .orderBy(desc(candidates.createdAt));

        const result = allCandidates.map((c) => ({
          ...c.candidate,
          user: c.user ? {
            id: c.user.id,
            name: c.user.fullName,
            email: c.user.email,
          } : null,
        }));

        res.json({ candidates: result });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Approve/reject candidate (admin)
  app.patch(
    "/api/admin/sgms/candidates/:id",
    authMiddleware,
    requireRole("admin", "vc"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }

        const [updated] = await db
          .update(candidates)
          .set({ status })
          .where(eq(candidates.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: "Candidate not found" });
        }

        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Delete candidate (admin)
  app.delete(
    "/api/admin/sgms/candidates/:id",
    authMiddleware,
    requireRole("admin", "vc"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        // Delete related votes first
        await db.delete(votes).where(eq(votes.candidateId, id));

        // Delete candidate
        const [deleted] = await db
          .delete(candidates)
          .where(eq(candidates.id, id))
          .returning();

        if (!deleted) {
          return res.status(404).json({ error: "Candidate not found" });
        }

        res.json({ success: true, message: "Candidate deleted successfully" });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // ============ WORK STUDY APPEALS & REVIEWS ============

  // Student: Submit appeal for auto-rejected application
  app.post(
    "/api/swsms/applications/:id/appeal",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { appealReason } = req.body;

        if (!appealReason || appealReason.trim().length < 50) {
          return res.status(400).json({
            error: "Appeal reason must be at least 50 characters and explain why you believe the decision should be reconsidered."
          });
        }

        // Verify application belongs to user and is auto-rejected
        const application = await db.query.workApplications.findFirst({
          where: and(
            eq(workApplications.id, id),
            eq(workApplications.userId, req.user!.id)
          ),
        });

        if (!application) {
          return res.status(404).json({ error: "Application not found" });
        }

        if (application.status !== "auto_rejected") {
          return res.status(400).json({
            error: "Only auto-rejected applications can be appealed"
          });
        }

        if (application.hasAppealed) {
          return res.status(400).json({
            error: "You have already submitted an appeal for this application"
          });
        }

        // Update application with appeal
        const [updated] = await db
          .update(workApplications)
          .set({
            status: "appealed",
            hasAppealed: true,
            appealReason,
            appealedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(workApplications.id, id))
          .returning();

        res.json({
          application: updated,
          message: "Appeal submitted successfully. The Work Study office will review your case.",
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin: Review appeal (approve to move to supervisor review, or reject permanently)
  app.patch(
    "/api/swsms/applications/:id/review-appeal",
    authMiddleware,
    requireRole("admin", "financial_aid"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { decision, notes } = req.body; // decision: "approved" or "rejected"

        const application = await db.query.workApplications.findFirst({
          where: eq(workApplications.id, id),
        });

        if (!application) {
          return res.status(404).json({ error: "Application not found" });
        }

        if (application.status !== "appealed") {
          return res.status(400).json({
            error: "Application is not in appealed status"
          });
        }

        const newStatus = decision === "approved" ? "supervisor_review" : "rejected";

        const [updated] = await db
          .update(workApplications)
          .set({
            status: newStatus,
            appealReviewedBy: req.user!.id,
            appealReviewNotes: notes,
            eligibilityPassed: decision === "approved", // Override if approved
            updatedAt: new Date(),
          })
          .where(eq(workApplications.id, id))
          .returning();

        res.json({
          application: updated,
          message: decision === "approved"
            ? "Appeal approved. Application forwarded to department supervisor."
            : "Appeal rejected. Application permanently rejected.",
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Supervisor: Review applications that passed eligibility (or appeals)
  app.patch(
    "/api/swsms/applications/:id/supervisor-review",
    authMiddleware,
    requireRole("admin", "supervisor"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { decision, notes } = req.body; // decision: "approved" or "rejected"

        const application = await db.query.workApplications.findFirst({
          where: eq(workApplications.id, id),
        });

        if (!application) {
          return res.status(404).json({ error: "Application not found" });
        }

        if (application.status !== "supervisor_review") {
          return res.status(400).json({
            error: "Application is not ready for supervisor review"
          });
        }

        const newStatus = decision === "approved" ? "approved" : "rejected";

        const [updated] = await db
          .update(workApplications)
          .set({
            status: newStatus,
            reviewedBy: req.user!.id,
            reviewNotes: notes,
            supervisorReviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(workApplications.id, id))
          .returning();

        res.json({
          application: updated,
          message: decision === "approved"
            ? "Application approved! Student can now begin logging work hours."
            : "Application rejected.",
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Get applications for supervisor review (department-specific)
  app.get(
    "/api/swsms/supervisor/applications",
    authMiddleware,
    requireRole("admin", "supervisor"),
    async (req: AuthRequest, res) => {
      try {
        const { department } = req.query;

        let query = db
          .select({
            application: workApplications,
            student: users,
          })
          .from(workApplications)
          .leftJoin(users, eq(workApplications.userId, users.id))
          .where(eq(workApplications.status, "supervisor_review"))
          .$dynamic();

        if (department) {
          query = query.where(
            and(
              eq(workApplications.status, "supervisor_review"),
              eq(workApplications.department, department as string)
            )
          );
        }

        const results = await query.orderBy(desc(workApplications.submittedAt));

        const applications = results.map((r) => ({
          ...r.application,
          student: r.student,
        }));

        res.json({ applications });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Get applications needing appeal review
  app.get(
    "/api/swsms/admin/appeals",
    authMiddleware,
    requireRole("admin", "financial_aid"),
    async (req: AuthRequest, res) => {
      try {
        const results = await db
          .select({
            application: workApplications,
            student: users,
          })
          .from(workApplications)
          .leftJoin(users, eq(workApplications.userId, users.id))
          .where(eq(workApplications.status, "appealed"))
          .orderBy(desc(workApplications.appealedAt));

        const appeals = results.map((r) => ({
          ...r.application,
          student: r.student,
        }));

        res.json({ appeals });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Legacy review endpoint (kept for backwards compatibility)
  app.patch(
    "/api/swsms/applications/:id/review",
    authMiddleware,
    requireRole("admin", "supervisor", "treasurer"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Get the application to find the user
        const [application] = await db
          .select()
          .from(workApplications)
          .where(eq(workApplications.id, id));

        if (!application) {
          return res.status(404).json({ error: "Application not found" });
        }

        // Update the application
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

        // If approved, update external API to set workStudy flag
        if (status === "approved") {
          try {
            // Get the user's studentId
            const [user] = await db
              .select()
              .from(users)
              .where(eq(users.id, application.userId));

            if (user?.studentId) {
              const { updateExternalWorkStudyStatus } = await import('./workStudyUtils');
              await updateExternalWorkStudyStatus(user.studentId, true);
              console.log(`✅ Updated external API: ${user.studentId} workStudy = true`);
            } else {
              console.warn(`⚠️ User ${application.userId} has no studentId, skipping external API update`);
            }
          } catch (apiError: any) {
            console.error("❌ Failed to update external API:", apiError.message);
            // Don't fail the approval if external API fails
            // Log the error but continue
          }
        }

        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // ============ SGMS GOVERNANCE ============
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

  // ============ HOSTEL & RESIDENCE MANAGEMENT ============

  // Get student hostel dashboard data
  /**
   * GET /api/student/hostel/dashboard
   * 
   * EXTERNAL API INTEGRATION - This endpoint fetches data from the university's 
   * external residence management system.
   * 
   * External API Base URL: https://studedatademo.azurewebsites.net
   * 
   * External Endpoints Used:
   * 1. GET /api/residences/student/:studentId
   *    - Returns student residence details (on/off campus, room info, hostel name, etc.)
   * 
   * 2. GET /api/residences
   *    - Returns all residence records (used to find roommates)
   * 
   * 3. GET /api/residences/attendance/student/:studentId?limit=30
   *    - Returns last 30 days of roll call attendance records
   * 
   * Response includes:
   * - residenceStatus: 'on-campus' | 'off-campus'
   * - roomAssignment: Room details from external API
   * - roommates: Other students in the same room
   * - attendanceHistory: Last 30 days of attendance (from external API)
   * - todayAttendance: Today's attendance status if marked
   */
  app.get("/api/student/hostel/dashboard", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const studentId = req.user!.universityId || req.user!.email.split("@")[0];

      console.log('\n=== [HOSTEL DASHBOARD] ===');
      console.log('[HOSTEL DASHBOARD] Loading for user:', userId, 'Student ID:', studentId);

      // Fetch residence data from external API
      console.log(`[EXTERNAL API] Fetching residence from: ${EXTERNAL_API_URL}/api/residences/student/${studentId}`);

      const residenceResponse = await fetch(`${EXTERNAL_API_URL}/api/residences/student/${studentId}`);

      let residenceStatus: 'on-campus' | 'off-campus' = 'off-campus';
      let roomAssignment = null;
      let roommates: any[] = [];
      let attendanceHistory: any[] = [];
      let todayAttendance = null;

      if (residenceResponse.ok) {
        const residenceData = await residenceResponse.json();
        console.log('[EXTERNAL API] Residence data received:', JSON.stringify(residenceData, null, 2));

        residenceStatus = residenceData.residenceType || 'off-campus';

        if (residenceStatus === 'on-campus' && residenceData.hostelName) {
          // Format room assignment for on-campus students
          roomAssignment = {
            hostelName: residenceData.hostelName,
            roomNumber: residenceData.roomNumber,
            bedNumber: residenceData.bedNumber,
            floor: null, // Not available from external API
            roomType: null, // Not available from external API
            capacity: residenceData.roomCapacity,
            currentOccupancy: residenceData.roomOccupancy,
            hasEnsuite: null, // Not available from external API
            assignedDate: residenceData.allocatedAt,
          };

          // Fetch roommates from external API
          // The external API doesn't have a direct roommates endpoint, so we'll query all residences
          // in the same room by filtering, then fetch student details
          console.log(`[EXTERNAL API] Fetching roommates for room ${residenceData.roomNumber} in ${residenceData.hostelName}`);
          console.log('[EXTERNAL API] Current student residence ID:', residenceData.id);

          try {
            const roommatesResponse = await fetch(`${EXTERNAL_API_URL}/api/residences`);
            if (roommatesResponse.ok) {
              const allResidences = await roommatesResponse.json();
              console.log('[EXTERNAL API] Total residences fetched:', allResidences.length);

              // Find current student's numeric studentId by matching residence ID
              const currentStudentRecord = allResidences.find((r: any) => r.id === residenceData.id);
              const currentStudentNumericId = currentStudentRecord?.studentId;
              console.log('[EXTERNAL API] Current student numeric ID:', currentStudentNumericId);

              // Filter for same room, excluding current student
              const roommateResidences = allResidences.filter((r: any) =>
                r.hostelName === residenceData.hostelName &&
                r.roomNumber === residenceData.roomNumber &&
                r.studentId !== currentStudentNumericId &&  // Compare numeric student IDs
                r.residenceType === 'on-campus'
              );

              console.log('[EXTERNAL API] Found', roommateResidences.length, 'roommate residence records');

              // Fetch student details for each roommate
              roommates = await Promise.all(
                roommateResidences.map(async (r: any) => {
                  try {
                    console.log(`[EXTERNAL API] Fetching student details for ID: ${r.studentId}`);
                    const studentResponse = await fetch(`${EXTERNAL_API_URL}/api/students/${r.studentId}`);

                    if (studentResponse.ok) {
                      const studentData = await studentResponse.json();
                      return {
                        studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Unknown',
                        studentId: studentData.studentId || `ID-${r.studentId}`,
                        phoneNumber: studentData.phone || 'N/A',
                        email: studentData.email || 'N/A',
                        assignedDate: r.allocatedAt,
                        startDate: r.allocatedAt,
                      };
                    } else {
                      console.error(`[EXTERNAL API ERROR] Failed to fetch student ${r.studentId}:`, studentResponse.status);
                      // Return partial data if student fetch fails
                      return {
                        studentName: 'Unknown Student',
                        studentId: `ID-${r.studentId}`,
                        phoneNumber: 'N/A',
                        email: 'N/A',
                        assignedDate: r.allocatedAt,
                        startDate: r.allocatedAt,
                      };
                    }
                  } catch (error) {
                    console.error(`[EXTERNAL API ERROR] Exception fetching student ${r.studentId}:`, error);
                    return {
                      studentName: 'Unknown Student',
                      studentId: `ID-${r.studentId}`,
                      phoneNumber: 'N/A',
                      email: 'N/A',
                      assignedDate: r.allocatedAt,
                      startDate: r.allocatedAt,
                    };
                  }
                })
              );

              console.log('[EXTERNAL API] Roommates processed:', roommates.length, 'with details');
            }
          } catch (error) {
            console.error('[EXTERNAL API ERROR] Failed to fetch roommates:', error);
          }
        } else if (residenceStatus === 'off-campus') {
          // For off-campus students, show off-campus details
          console.log('[EXTERNAL API] Processing off-campus residence data');
          roomAssignment = {
            hostelName: residenceData.offCampusHostelName || 'Not specified',
            roomNumber: residenceData.offCampusRoomNumber || 'N/A',
            bedNumber: null,
            floor: null,
            roomType: 'off-campus',
            capacity: null,
            currentOccupancy: null,
            hasEnsuite: null,
            assignedDate: residenceData.allocatedAt,
            area: residenceData.offCampusArea || 'Not specified',
          };
          console.log('[EXTERNAL API] Off-campus room assignment:', JSON.stringify(roomAssignment, null, 2));
        }

        // Get attendance history from external API
        console.log(`[EXTERNAL API] Fetching attendance from: ${EXTERNAL_API_URL}/api/residences/attendance/student/${studentId}`);

        try {
          const attendanceResponse = await fetch(`${EXTERNAL_API_URL}/api/residences/attendance/student/${studentId}?limit=30`);

          console.log('[EXTERNAL API] Attendance response status:', attendanceResponse.status);

          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json();
            console.log('[EXTERNAL API] Raw attendance data:', JSON.stringify(attendanceData, null, 2));
            console.log('[EXTERNAL API] Attendance data received:', attendanceData.totalRecords, 'records');
            console.log('[EXTERNAL API] Attendance array length:', attendanceData.attendance?.length);

            // Map external attendance format to our format
            attendanceHistory = attendanceData.attendance.map((record: any) => ({
              id: record.id,
              date: record.date,
              checkInTime: record.date, // Use date as check-in time
              status: record.status,
              notes: record.notes,
              hostelName: record.hostelName,
              roomNumber: record.roomNumber,
              markedBy: record.officerName ? `${record.officerName} ${record.officerLastName || ''}`.trim() : 'Officer',
              isWithinWindow: true, // Assume external records are valid
            }));

            // Check if already marked today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);

            todayAttendance = attendanceHistory.find((record: any) => {
              const recordDate = new Date(record.date);
              return recordDate >= today && recordDate <= todayEnd;
            }) || null;

            console.log('[EXTERNAL API] Today attendance:', todayAttendance ? 'Found' : 'Not found');
          } else {
            console.log('[EXTERNAL API] Attendance fetch failed:', attendanceResponse.status);
          }
        } catch (error) {
          console.error('[EXTERNAL API ERROR] Failed to fetch attendance:', error);
          // Fallback to empty array if external API fails
          attendanceHistory = [];
        }
      } else {
        console.log('[EXTERNAL API] No residence data found or API error:', residenceResponse.status);
        // Student might not have a residence allocation yet
      }

      console.log('[HOSTEL DASHBOARD] Response:', {
        residenceStatus,
        hasRoom: !!roomAssignment,
        roommatesCount: roommates.length,
        attendanceRecords: attendanceHistory.length,
        checkedInToday: !!todayAttendance
      });
      console.log('[HOSTEL DASHBOARD] Roommates being sent:', JSON.stringify(roommates, null, 2));

      res.json({
        residenceStatus,
        roomAssignment,
        roommates,
        attendanceHistory,
        todayAttendance,
      });
    } catch (error: any) {
      console.error('[HOSTEL DASHBOARD ERROR]', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Officer/Admin marks student hostel attendance
  app.post("/api/admin/hostel/mark-attendance", authMiddleware, requireRole("admin", "supervisor"), async (req: AuthRequest, res) => {
    try {
      const { studentId, status, notes } = req.body;
      const markedBy = req.user!.id;

      if (!studentId || !status) {
        return res.status(400).json({ error: "Student ID and status are required" });
      }

      console.log('\n=== [HOSTEL ATTENDANCE MARKING] ===');
      console.log('[ATTENDANCE] Officer:', markedBy, 'Marking for student:', studentId);
      console.log('[ATTENDANCE] Status:', status, 'Notes:', notes);

      // Find the user by university ID
      const student = await db.query.users.findFirst({
        where: eq(users.universityId, studentId)
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Verify student has residence allocation from external API
      console.log(`[EXTERNAL API] Checking residence: ${EXTERNAL_API_URL}/api/residences/student/${studentId}`);
      const residenceResponse = await fetch(`${EXTERNAL_API_URL}/api/residences/student/${studentId}`);

      if (!residenceResponse.ok) {
        return res.status(400).json({ error: "Student doesn't have an active residence allocation" });
      }

      const residenceData = await residenceResponse.json();
      console.log('[EXTERNAL API] Residence status:', residenceData.residenceType);

      if (residenceData.residenceType !== 'on-campus') {
        return res.status(400).json({ error: "Roll call is only for on-campus residents" });
      }

      // Check if already marked today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingAttendance = await db.query.hostelAttendance.findFirst({
        where: and(
          eq(hostelAttendance.userId, student.id),
          sql`${hostelAttendance.date} >= ${today.toISOString()}`
        ),
      });

      if (existingAttendance) {
        // Update existing attendance
        const [updated] = await db
          .update(hostelAttendance)
          .set({
            status,
            notes,
            checkInTime: new Date(),
            markedBy,
          })
          .where(eq(hostelAttendance.id, existingAttendance.id))
          .returning();

        console.log('[ATTENDANCE] Updated existing record:', updated.id);
        return res.json({ attendance: updated, message: "Attendance updated" });
      }

      // Check if within roll call window (9:30 PM - 10:00 PM)
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isWithinWindow = (hours === 21 && minutes >= 30) || (hours === 22 && minutes === 0);

      // Create attendance record
      const [attendance] = await db.insert(hostelAttendance).values({
        roomId: `external-${residenceData.hostelName}-${residenceData.roomNumber}`,
        userId: student.id,
        date: now,
        checkInTime: now,
        status,
        isWithinWindow: isWithinWindow,
        notes,
        markedBy,
      }).returning();

      console.log('[ATTENDANCE] Marked successfully:', {
        studentId,
        userId: student.id,
        status,
        time: now.toLocaleTimeString(),
        isWithinWindow,
      });

      res.json({ attendance, message: "Attendance marked successfully" });
    } catch (error: any) {
      console.error('[HOSTEL ATTENDANCE ERROR]', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit hostel application (for off-campus students) - redirects to external booking API
  app.post("/api/student/hostel/apply", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const studentId = req.user!.universityId || req.user!.email.split("@")[0];

      console.log('\n=== [HOSTEL APPLICATION] ===');
      console.log('[HOSTEL APPLICATION] User:', userId, 'Student ID:', studentId);

      // Check current residence status from external API
      const residenceResponse = await fetch(`${EXTERNAL_API_URL}/api/residences/student/${studentId}`);

      if (residenceResponse.ok) {
        const residenceData = await residenceResponse.json();
        if (residenceData.residenceType === 'on-campus') {
          return res.status(400).json({ error: "You already have an on-campus residence allocation" });
        }
      }

      // Submit booking request to external API
      console.log(`[EXTERNAL API] Submitting booking: ${EXTERNAL_API_URL}/api/residences/bookings`);

      const bookingData = {
        studentId: studentId,
        studentName: req.user!.fullName,
        currentLocation: req.body.currentAddress || 'Not specified',
        reason: req.body.reason || 'Requesting on-campus accommodation',
        preferredHostelId: req.body.preferredHostelId || null,
        status: 'pending',
      };

      const bookingResponse = await fetch(`${EXTERNAL_API_URL}/api/residences/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!bookingResponse.ok) {
        const errorText = await bookingResponse.text();
        console.error('[EXTERNAL API ERROR]', errorText);
        return res.status(bookingResponse.status).json({
          error: 'Failed to submit booking request to external system'
        });
      }

      const booking = await bookingResponse.json();
      console.log('[EXTERNAL API] Booking created:', booking.id);

      res.json({
        application: booking,
        message: 'Booking request submitted successfully'
      });
    } catch (error: any) {
      console.error('[HOSTEL APPLICATION ERROR]', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ DEPARTMENT SUPERVISOR ENDPOINTS ============
  // Department supervisors (HODs) can manage timecards for students in their department

  // Get dashboard statistics for supervisor's department
  app.get("/api/supervisor/dashboard/stats", authMiddleware, requireRole("supervisor"), async (req: AuthRequest, res) => {
    const user = req.user!;

    try {
      // Get all applications supervised by this user
      const applications = await db.select()
        .from(workApplications)
        .where(eq(workApplications.supervisorId, user.id));

      const applicationIds = applications.map(app => app.id);

      if (applicationIds.length === 0) {
        return res.json({
          totalStudents: 0,
          pendingTimecards: 0,
          verifiedTimecards: 0,
          totalHoursThisMonth: 0
        });
      }

      // Get timecards for these applications
      const allTimecards = await db.select()
        .from(timecards)
        .where(inArray(timecards.applicationId, applicationIds));

      const pendingTimecards = allTimecards.filter(tc => tc.status === 'pending').length;
      const verifiedTimecards = allTimecards.filter(tc => tc.status === 'verified').length;

      // Calculate total hours for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const totalHoursThisMonth = allTimecards
        .filter(tc => new Date(tc.date) >= startOfMonth)
        .reduce((sum, tc) => sum + (parseFloat(tc.hoursWorked as string) || 0), 0);

      res.json({
        totalStudents: applications.length,
        pendingTimecards,
        verifiedTimecards,
        totalHoursThisMonth
      });
    } catch (error) {
      console.error("Error fetching supervisor dashboard stats:", error);
      res.status(500).send({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Get timecards for supervisor's department
  app.get("/api/supervisor/timecards", authMiddleware, requireRole("supervisor"), async (req: AuthRequest, res) => {
    const user = req.user!;

    try {
      const { status, search } = req.query;

      // Get all applications supervised by this user
      const applications = await db.select()
        .from(workApplications)
        .where(eq(workApplications.supervisorId, user.id));

      const applicationIds = applications.map(app => app.id);

      if (applicationIds.length === 0) {
        return res.json([]);
      }

      // Get timecards for these applications
      let query = db.select({
        id: timecards.id,
        date: timecards.date,
        hoursWorked: timecards.hoursWorked,
        status: timecards.status,
        earnings: timecards.earnings,
        applicationId: timecards.applicationId,
        studentName: users.fullName,
        studentId: users.studentId,
        department: workApplications.department
      })
        .from(timecards)
        .innerJoin(workApplications, eq(timecards.applicationId, workApplications.id))
        .innerJoin(users, eq(workApplications.userId, users.id))
        .where(inArray(timecards.applicationId, applicationIds));

      const allTimecards = await query;

      // Apply filters
      let filteredTimecards = allTimecards;

      if (status && status !== 'all') {
        filteredTimecards = filteredTimecards.filter(tc => tc.status === status);
      }

      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredTimecards = filteredTimecards.filter(tc =>
          tc.studentName?.toLowerCase().includes(searchLower) ||
          tc.studentId?.toLowerCase().includes(searchLower) ||
          tc.department?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by date descending
      filteredTimecards.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json(filteredTimecards);
    } catch (error) {
      console.error("Error fetching supervisor timecards:", error);
      res.status(500).send({ message: "Failed to fetch timecards" });
    }
  });

  // Verify a timecard (approve)
  app.patch("/api/supervisor/timecards/:id/verify", authMiddleware, requireRole("supervisor"), async (req: AuthRequest, res) => {
    const user = req.user!;

    try {
      const { id } = req.params;

      // Get the timecard
      const timecard = await db.select()
        .from(timecards)
        .where(eq(timecards.id, id))
        .limit(1);

      if (timecard.length === 0) {
        return res.status(404).send({ message: "Timecard not found" });
      }

      // Verify the timecard belongs to an application supervised by this user
      const application = await db.select()
        .from(workApplications)
        .where(and(
          eq(workApplications.id, timecard[0].applicationId),
          eq(workApplications.supervisorId, user.id)
        ))
        .limit(1);

      if (application.length === 0) {
        return res.status(403).send({ message: "You don't have permission to verify this timecard" });
      }

      // Update timecard status
      await db.update(timecards)
        .set({
          status: "verified",
          verifiedBy: user.id
        })
        .where(eq(timecards.id, id));

      res.json({ message: "Timecard verified successfully" });
    } catch (error) {
      console.error("Error verifying timecard:", error);
      res.status(500).send({ message: "Failed to verify timecard" });
    }
  });

  // Reject a timecard
  app.patch("/api/supervisor/timecards/:id/reject", authMiddleware, requireRole("supervisor"), async (req: AuthRequest, res) => {
    const user = req.user!;

    try {
      const { id } = req.params;
      const { comments } = req.body;

      // Get the timecard
      const timecard = await db.select()
        .from(timecards)
        .where(eq(timecards.id, id))
        .limit(1);

      if (timecard.length === 0) {
        return res.status(404).send({ message: "Timecard not found" });
      }

      // Verify the timecard belongs to an application supervised by this user
      const application = await db.select()
        .from(workApplications)
        .where(and(
          eq(workApplications.id, timecard[0].applicationId),
          eq(workApplications.supervisorId, user.id)
        ))
        .limit(1);

      if (application.length === 0) {
        return res.status(403).send({ message: "You don't have permission to reject this timecard" });
      }

      // Update timecard status (Note: comments field may not exist in schema)
      await db.update(timecards)
        .set({
          status: "rejected",
          verifiedBy: user.id  // Track who rejected it
        })
        .where(eq(timecards.id, id));

      res.json({ message: "Timecard rejected successfully" });
    } catch (error) {
      console.error("Error rejecting timecard:", error);
      res.status(500).send({ message: "Failed to reject timecard" });
    }
  });

  // Get department information
  app.get("/api/supervisor/department", authMiddleware, requireRole("supervisor"), async (req: AuthRequest, res) => {
    const user = req.user!;

    try {
      // Get all applications supervised by this user
      const applications = await db.select()
        .from(workApplications)
        .where(eq(workApplications.supervisorId, user.id))
        .limit(1);

      if (applications.length === 0) {
        return res.json({ department: "No Department Assigned" });
      }

      res.json({
        department: applications[0].department,
        supervisorName: user.fullName
      });
    } catch (error) {
      console.error("Error fetching department info:", error);
      res.status(500).send({ message: "Failed to fetch department info" });
    }
  });

  // Get analytics data for supervisor's department
  app.get("/api/supervisor/analytics", authMiddleware, requireRole("supervisor"), async (req: AuthRequest, res) => {
    const user = req.user!;

    try {
      // Get all applications supervised by this user
      const applications = await db.select()
        .from(workApplications)
        .where(eq(workApplications.supervisorId, user.id));

      const applicationIds = applications.map(app => app.id);

      if (applicationIds.length === 0) {
        return res.json({
          weeklyHours: [],
          studentPerformance: [],
          statusBreakdown: { pending: 0, verified: 0, rejected: 0, paid: 0 },
          monthlyTrends: []
        });
      }

      // Get all timecards
      const allTimecards = await db.select({
        id: timecards.id,
        date: timecards.date,
        hoursWorked: timecards.hoursWorked,
        status: timecards.status,
        earnings: timecards.earnings,
        applicationId: timecards.applicationId,
      })
        .from(timecards)
        .where(inArray(timecards.applicationId, applicationIds));

      // Weekly hours for last 8 weeks
      const weeklyHours = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekCards = allTimecards.filter(tc => {
          const tcDate = new Date(tc.date);
          return tcDate >= weekStart && tcDate < weekEnd;
        });

        const totalHours = weekCards.reduce((sum, tc) =>
          sum + (parseFloat(tc.hoursWorked as string) || 0), 0
        );

        weeklyHours.push({
          week: `Week ${8 - i}`,
          hours: Math.round(totalHours * 10) / 10,
          timecards: weekCards.length
        });
      }

      // Student performance - top students by hours
      const studentHours = new Map<number, { name: string; hours: number; timecards: number }>();

      for (const tc of allTimecards) {
        const app = applications.find(a => a.id === tc.applicationId);
        if (!app) continue;

        const student = await db.select({ fullName: users.fullName })
          .from(users)
          .where(eq(users.id, app.userId))
          .limit(1);

        if (student.length === 0) continue;

        const existing = studentHours.get(app.userId) || {
          name: student[0].fullName,
          hours: 0,
          timecards: 0
        };

        studentHours.set(app.userId, {
          name: existing.name,
          hours: existing.hours + (parseFloat(tc.hoursWorked as string) || 0),
          timecards: existing.timecards + 1
        });
      }

      const studentPerformance = Array.from(studentHours.values())
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10)
        .map(s => ({
          ...s,
          hours: Math.round(s.hours * 10) / 10
        }));

      // Status breakdown
      const statusBreakdown = {
        pending: allTimecards.filter(tc => tc.status === 'pending').length,
        verified: allTimecards.filter(tc => tc.status === 'verified').length,
        rejected: allTimecards.filter(tc => tc.status === 'rejected').length,
        paid: allTimecards.filter(tc => tc.status === 'paid').length,
      };

      // Monthly trends for last 6 months
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthCards = allTimecards.filter(tc => {
          const tcDate = new Date(tc.date);
          return tcDate >= monthDate && tcDate <= monthEnd;
        });

        const totalHours = monthCards.reduce((sum, tc) =>
          sum + (parseFloat(tc.hoursWorked as string) || 0), 0
        );

        const totalEarnings = monthCards
          .filter(tc => tc.status === 'verified' || tc.status === 'paid')
          .reduce((sum, tc) => sum + (parseFloat(tc.earnings as string) || 0), 0);

        monthlyTrends.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          hours: Math.round(totalHours * 10) / 10,
          earnings: Math.round(totalEarnings * 100) / 100,
          timecards: monthCards.length
        });
      }

      res.json({
        weeklyHours,
        studentPerformance,
        statusBreakdown,
        monthlyTrends
      });
    } catch (error) {
      console.error("Error fetching supervisor analytics:", error);
      res.status(500).send({ message: "Failed to fetch analytics" });
    }
  });

  // ============ DATABASE MIGRATION ENDPOINT ============
  app.post("/api/admin/run-migration", async (req, res) => {
    try {
      console.log("Running manual migration...");

      // Add student_id to users table
      await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "student_id" text`);
      try {
        await db.execute(sql`ALTER TABLE "users" ADD CONSTRAINT "users_student_id_unique" UNIQUE("student_id")`);
      } catch (e: any) {
        if (!e.message?.includes('already exists')) throw e;
      }

      // Make gender and marital_status nullable (ignore errors if already nullable)
      try {
        await db.execute(sql`ALTER TABLE "work_applications" ALTER COLUMN "gender" DROP NOT NULL`);
      } catch (e: any) {
        console.log("gender already nullable or doesn't exist:", e.message);
      }
      try {
        await db.execute(sql`ALTER TABLE "work_applications" ALTER COLUMN "marital_status" DROP NOT NULL`);
      } catch (e: any) {
        console.log("marital_status already nullable or doesn't exist:", e.message);
      }

      // Add eligibility tracking fields
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "eligibility_checked" boolean DEFAULT false NOT NULL`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "eligibility_passed" boolean`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "eligibility_details" text`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "fee_balance_at_submission" numeric(10, 2)`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "fee_balance_eligible" boolean`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "is_registered_current_semester" boolean`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "credit_hours_at_submission" integer`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "credit_hours_eligible" boolean`);

      // Add appeal fields
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "has_appealed" boolean DEFAULT false NOT NULL`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "appeal_reason" text`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "appealed_at" timestamp`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "appeal_reviewed_by" varchar`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "appeal_review_notes" text`);

      // Add supervisor fields
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "supervisor_id" varchar`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "supervisor_reviewed_at" timestamp`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp`);

      console.log("✅ Migration completed successfully!");
      res.json({ success: true, message: "Database migration completed successfully" });
    } catch (error: any) {
      console.error("❌ Migration failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============ FIX EXISTING USERS' STUDENT IDs ============
  app.post("/api/admin/fix-student-ids", async (req, res) => {
    try {
      console.log("🔧 Fixing student IDs for existing users...");

      // Update all users who have universityId but no studentId
      const result = await db.execute(sql`
        UPDATE users 
        SET student_id = university_id 
        WHERE student_id IS NULL 
        AND university_id IS NOT NULL
      `);

      console.log("✅ Student IDs fixed successfully!");
      res.json({
        success: true,
        message: "Student IDs updated successfully",
        rowsUpdated: result.rowCount || 0
      });
    } catch (error: any) {
      console.error("❌ Fix failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============ WORK STUDY SUPERVISOR (wSupervisor) ENDPOINTS ============

  // Dashboard Overview Statistics
  app.get("/api/wsupervisor/dashboard/stats", authMiddleware, requireRole("wSupervisor"), async (req: AuthRequest, res) => {
    try {
      // Total applications count by status
      const applicationStats = await db
        .select({
          status: workApplications.status,
          count: count()
        })
        .from(workApplications)
        .groupBy(workApplications.status);

      // Total timecards count by status
      const timecardStats = await db
        .select({
          status: timecards.status,
          count: count()
        })
        .from(timecards)
        .groupBy(timecards.status);

      // Total hours worked (verified only)
      const totalHoursResult = await db
        .select({
          totalHours: sql<string>`SUM(CAST(${timecards.hoursWorked} AS NUMERIC))`
        })
        .from(timecards)
        .where(eq(timecards.status, 'verified'));

      // Total earnings (verified only)
      const totalEarningsResult = await db
        .select({
          totalEarnings: sql<string>`SUM(CAST(${timecards.earnings} AS NUMERIC))`
        })
        .from(timecards)
        .where(eq(timecards.status, 'verified'));

      // Active workers (approved applications)
      const activeWorkersResult = await db
        .select({ count: count() })
        .from(workApplications)
        .where(eq(workApplications.status, 'approved'));

      // Department breakdown
      const departmentStats = await db
        .select({
          department: workApplications.department,
          count: count()
        })
        .from(workApplications)
        .where(eq(workApplications.status, 'approved'))
        .groupBy(workApplications.department);

      res.json({
        applications: applicationStats,
        timecards: timecardStats,
        totalHours: totalHoursResult[0]?.totalHours || '0',
        totalEarnings: totalEarningsResult[0]?.totalEarnings || '0',
        activeWorkers: activeWorkersResult[0]?.count || 0,
        departments: departmentStats
      });
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all applications with filtering
  app.get("/api/wsupervisor/applications", authMiddleware, requireRole("wSupervisor"), async (req: AuthRequest, res) => {
    try {
      const { status, department, search } = req.query;

      let query = db
        .select({
          id: workApplications.id,
          applicationId: workApplications.applicationId,
          fullName: workApplications.fullName,
          department: workApplications.department,
          position: workApplications.position,
          status: workApplications.status,
          hoursPerWeek: workApplications.hoursPerWeek,
          createdAt: workApplications.createdAt,
          userId: workApplications.userId,
          email: users.email,
        })
        .from(workApplications)
        .leftJoin(users, eq(workApplications.userId, users.id))
        .orderBy(desc(workApplications.createdAt));

      const apps = await query;

      // Filter by status, department, and search
      let filtered = apps;

      if (status && typeof status === 'string') {
        filtered = filtered.filter(app => app.status === status);
      }
      if (department && typeof department === 'string') {
        filtered = filtered.filter(app => app.department === department);
      }

      // Filter by search if provided
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(app =>
          app.fullName?.toLowerCase().includes(searchLower) ||
          app.applicationId?.toLowerCase().includes(searchLower) ||
          app.email?.toLowerCase().includes(searchLower)
        );
      }

      res.json({ applications: filtered });
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all timecards with filtering
  app.get("/api/wsupervisor/timecards", authMiddleware, requireRole("wSupervisor"), async (req: AuthRequest, res) => {
    try {
      const { status, department, startDate, endDate } = req.query;

      const timecardsList = await db
        .select({
          id: timecards.id,
          date: timecards.date,
          hoursWorked: timecards.hoursWorked,
          hourlyRate: timecards.hourlyRate,
          earnings: timecards.earnings,
          status: timecards.status,
          taskDescription: timecards.taskDescription,
          createdAt: timecards.createdAt,
          verifiedBy: timecards.verifiedBy,
          userId: timecards.userId,
          applicationId: timecards.applicationId,
          application: {
            id: workApplications.id,
            fullName: workApplications.fullName,
            department: workApplications.department,
            position: workApplications.position,
          },
          user: {
            id: users.id,
            fullName: users.fullName,
            email: users.email,
          }
        })
        .from(timecards)
        .leftJoin(workApplications, eq(timecards.applicationId, workApplications.id))
        .leftJoin(users, eq(timecards.userId, users.id))
        .orderBy(desc(timecards.createdAt));

      // Filter by status
      let filtered = timecardsList;
      if (status) {
        filtered = filtered.filter(tc => tc.status === status);
      }
      if (department) {
        filtered = filtered.filter(tc => tc.application?.department === department);
      }

      res.json({ timecards: filtered });
    } catch (error: any) {
      console.error("Error fetching timecards:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verify timecard (approve)
  app.patch("/api/wsupervisor/timecards/:id/verify", authMiddleware, requireRole("wSupervisor"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const [timecard] = await db
        .select()
        .from(timecards)
        .where(eq(timecards.id, id))
        .limit(1);

      if (!timecard) {
        return res.status(404).json({ error: "Timecard not found" });
      }

      // Calculate earnings
      const hoursWorked = timecard.hoursWorked ? parseFloat(timecard.hoursWorked) : 0;
      const hourlyRate = timecard.hourlyRate ? parseFloat(timecard.hourlyRate) : 0;
      const earnings = hoursWorked * hourlyRate;

      const [updated] = await db
        .update(timecards)
        .set({
          status: 'verified',
          verifiedBy: req.user!.id,
          earnings: earnings.toString(),
        })
        .where(eq(timecards.id, id))
        .returning();

      res.json({ timecard: updated, message: "Timecard verified successfully" });
    } catch (error: any) {
      console.error("Error verifying timecard:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reject timecard
  app.patch("/api/wsupervisor/timecards/:id/reject", authMiddleware, requireRole("wSupervisor"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const [updated] = await db
        .update(timecards)
        .set({
          status: 'rejected',
          verifiedBy: req.user!.id,
        })
        .where(eq(timecards.id, id))
        .returning();

      res.json({ timecard: updated, message: "Timecard rejected" });
    } catch (error: any) {
      console.error("Error rejecting timecard:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk verify timecards
  app.post("/api/wsupervisor/timecards/bulk-verify", authMiddleware, requireRole("wSupervisor"), async (req: AuthRequest, res) => {
    try {
      const { timecardIds } = req.body;

      if (!Array.isArray(timecardIds) || timecardIds.length === 0) {
        return res.status(400).json({ error: "Invalid timecard IDs" });
      }

      for (const id of timecardIds) {
        const [timecard] = await db
          .select()
          .from(timecards)
          .where(eq(timecards.id, id))
          .limit(1);

        if (timecard) {
          const hoursWorked = timecard.hoursWorked ? parseFloat(timecard.hoursWorked) : 0;
          const hourlyRate = timecard.hourlyRate ? parseFloat(timecard.hourlyRate) : 0;
          const earnings = hoursWorked * hourlyRate;

          await db
            .update(timecards)
            .set({
              status: 'verified',
              verifiedBy: req.user!.id,
              earnings: earnings.toString()
            })
            .where(eq(timecards.id, id));
        }
      }

      res.json({
        success: true,
        count: timecardIds.length,
        message: `${timecardIds.length} timecards verified successfully`
      });
    } catch (error: any) {
      console.error("Error bulk verifying timecards:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get department overview
  app.get("/api/wsupervisor/departments", authMiddleware, requireRole("wSupervisor"), async (req: AuthRequest, res) => {
    try {
      const { getAllDepartmentRates } = await import('./departmentRates');
      const departments = await getAllDepartmentRates();

      // Get worker count for each department
      const departmentData = await Promise.all(
        departments.map(async (dept) => {
          const workersResult = await db
            .select({ count: count() })
            .from(workApplications)
            .where(
              and(
                eq(workApplications.department, dept.department),
                eq(workApplications.status, 'approved')
              )
            );

          const pendingTimecardsResult = await db
            .select({ count: count() })
            .from(timecards)
            .leftJoin(workApplications, eq(timecards.applicationId, workApplications.id))
            .where(
              and(
                eq(workApplications.department, dept.department),
                eq(timecards.status, 'pending')
              )
            );

          return {
            ...dept,
            workerCount: workersResult[0]?.count || 0,
            pendingTimecards: pendingTimecardsResult[0]?.count || 0
          };
        })
      );

      res.json({ departments: departmentData });
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get workers by department
  app.get("/api/wsupervisor/departments/:department/workers", authMiddleware, requireRole("wSupervisor"), async (req: AuthRequest, res) => {
    try {
      const { department } = req.params;

      const workers = await db
        .select({
          id: workApplications.id,
          fullName: workApplications.fullName,
          position: workApplications.position,
          hoursPerWeek: workApplications.hoursPerWeek,
          status: workApplications.status,
          createdAt: workApplications.createdAt,
          userId: workApplications.userId,
          email: users.email,
        })
        .from(workApplications)
        .leftJoin(users, eq(workApplications.userId, users.id))
        .where(
          and(
            eq(workApplications.department, department),
            eq(workApplications.status, 'approved')
          )
        )
        .orderBy(workApplications.fullName);

      // Get timecard stats for each worker
      const workersWithStats = await Promise.all(
        workers.map(async (worker) => {
          const stats = await db
            .select({
              totalHours: sql<string>`SUM(CAST(${timecards.hoursWorked} AS NUMERIC))`,
              totalEarnings: sql<string>`SUM(CAST(${timecards.earnings} AS NUMERIC))`,
              pendingCount: count()
            })
            .from(timecards)
            .where(
              and(
                eq(timecards.userId, worker.userId),
                eq(timecards.status, 'pending')
              )
            );

          return {
            ...worker,
            totalHours: stats[0]?.totalHours || '0',
            totalEarnings: stats[0]?.totalEarnings || '0',
            pendingTimecards: stats[0]?.pendingCount || 0
          };
        })
      );

      res.json({ workers: workersWithStats });
    } catch (error: any) {
      console.error("Error fetching department workers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ END WORK STUDY SUPERVISOR ENDPOINTS ============

  // ============ ADD APPLICATION_ID COLUMN ============
  app.post("/api/admin/add-application-id", async (req, res) => {
    try {
      console.log("🔧 Adding application_id column to work_applications...");

      // Add application_id column
      await db.execute(sql`ALTER TABLE "work_applications" ADD COLUMN IF NOT EXISTS "application_id" text`);
      await db.execute(sql`ALTER TABLE "work_applications" ADD CONSTRAINT IF NOT EXISTS "work_applications_application_id_unique" UNIQUE("application_id")`);

      // Generate IDs for existing applications
      const { generateApplicationId } = await import('./workStudyUtils');
      const existingApps = await db.query.workApplications.findMany({
        where: sql`application_id IS NULL`,
      });

      for (const app of existingApps) {
        const appId = generateApplicationId();
        await db.execute(sql`UPDATE work_applications SET application_id = ${appId} WHERE id = ${app.id}`);
      }

      console.log(`✅ Added application_id column and generated ${existingApps.length} IDs!`);
      res.json({
        success: true,
        message: "Application ID column added successfully",
        idsGenerated: existingApps.length
      });
    } catch (error: any) {
      console.error("❌ Migration failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============ SEED STUDENT004 DATA ENDPOINT ============
  // COMMENTED OUT DUE TO SCHEMA MISMATCHES - Use manual seeding instead
  /*
  app.post("/api/admin/seed-student004", async (req, res) => {
    // ... seed code commented out ...
  });
  */

  const httpServer = createServer(app);
  return httpServer;
}
