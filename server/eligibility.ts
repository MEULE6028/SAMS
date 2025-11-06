/**
 * Work Study Eligibility Service
 * 
 * Validates student eligibility for work study program based on:
 * - Completed at least one semester at the university
 * - Fee balance > ETB 10,000 (showing financial need)
 * 
 * Note: workStudy flag is NOT checked during application - it's updated
 * AFTER supervisor approval via external API integration
 */

import type { ExternalStudent } from '../client/src/lib/externalAPI';

export interface EligibilityCheckResult {
  passed: boolean;
  checks: {
    semesterCompletion: CheckDetail;
    feeBalance: CheckDetail;
  };
  overallMessage: string;
}

interface CheckDetail {
  passed: boolean;
  message: string;
  value?: any;
  requirement?: any;
}

// Configuration - can be moved to environment variables or database
const ELIGIBILITY_RULES = {
  MIN_FEE_BALANCE: 10000, // Minimum balance showing financial need (ETB)
  MIN_SEMESTERS_COMPLETED: 1, // Must complete at least 1 semester
};

/**
 * Performs comprehensive eligibility check for work study application
 */
export async function checkWorkStudyEligibility(
  studentData: ExternalStudent,
  applicationData: {
    registeredUnitsHours?: number;
  }
): Promise<EligibilityCheckResult> {
  const checks = {
    semesterCompletion: checkSemesterCompletion(studentData),
    feeBalance: checkFeeBalance(studentData),
  };

  const allPassed = Object.values(checks).every(check => check.passed);
  const failedChecks = Object.entries(checks)
    .filter(([_, check]) => !check.passed)
    .map(([name, check]) => check.message);

  return {
    passed: allPassed,
    checks,
    overallMessage: allPassed
      ? '✓ All eligibility requirements met. Application forwarded to department supervisor for review.'
      : `✗ Application does not meet the following requirements:\n${failedChecks.join('\n')}`,
  };
}

/**
 * Check 1: Semester Completion
 * Student must have completed at least one semester
 */
function checkSemesterCompletion(studentData: ExternalStudent): CheckDetail {
  // Parse semester to determine completion
  // Format: "2025-1" means year 2025, semester 1
  const currentSemester = studentData.currentSemester || '';
  const semesterParts = currentSemester.split('-');

  // If student is in semester 2 or higher, they've completed at least 1 semester
  // Or if they're in a later year, they've completed multiple semesters
  const year = parseInt(semesterParts[0] || '0');
  const semester = parseInt(semesterParts[1] || '0');

  // Simple check: if in semester 2 or later, they've completed 1 semester
  // More robust: check enrollments history or add semesters_completed field
  const hasCompletedSemester = semester >= 2 || (studentData.enrollments && studentData.enrollments.length > 0);

  const passed = hasCompletedSemester || false;

  return {
    passed,
    message: passed
      ? `✓ Student has completed required semester(s) (Currently in ${currentSemester})`
      : `✗ Student must complete at least one semester before applying. Current semester: ${currentSemester || 'Not enrolled'}`,
    value: currentSemester,
    requirement: `At least ${ELIGIBILITY_RULES.MIN_SEMESTERS_COMPLETED} semester completed`,
  };
}

/**
 * Check 2: Fee Balance - Shows Financial Need
 * Student must have outstanding balance > ETB 10,000 to show financial need
 */
function checkFeeBalance(studentData: ExternalStudent): CheckDetail {
  const balance = studentData.balance || 0;
  const passed = balance >= ELIGIBILITY_RULES.MIN_FEE_BALANCE;

  return {
    passed,
    message: passed
      ? `✓ Fee balance (ETB ${balance.toLocaleString()}) demonstrates financial need`
      : `✗ Fee balance (ETB ${balance.toLocaleString()}) below minimum (ETB ${ELIGIBILITY_RULES.MIN_FEE_BALANCE.toLocaleString()}). Work study is for students with financial need.`,
    value: balance,
    requirement: ELIGIBILITY_RULES.MIN_FEE_BALANCE,
  };
}

/**
 * Helper function to format eligibility details for database storage
 */
export function formatEligibilityDetails(result: EligibilityCheckResult): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    passed: result.passed,
    checks: result.checks,
    message: result.overallMessage,
  }, null, 2);
}

/**
 * Helper function to determine next status based on eligibility check
 */
export function determineApplicationStatus(result: EligibilityCheckResult): string {
  if (result.passed) {
    return 'supervisor_review'; // Passed all checks, goes to supervisor
  } else {
    return 'auto_rejected'; // Failed checks, but can appeal
  }
}

/**
 * Get human-readable status display
 */
export function getStatusDisplay(status: string): { label: string; color: string; description: string } {
  const statusMap: Record<string, { label: string; color: string; description: string }> = {
    pending: {
      label: 'Pending',
      color: 'gray',
      description: 'Application submitted, awaiting eligibility review',
    },
    under_review: {
      label: 'Under Review',
      color: 'blue',
      description: 'Automated eligibility checks in progress',
    },
    auto_rejected: {
      label: 'Not Eligible',
      color: 'orange',
      description: 'Did not meet eligibility requirements. You can appeal this decision.',
    },
    appealed: {
      label: 'Appeal Submitted',
      color: 'yellow',
      description: 'Your appeal is under review by the Work Study office',
    },
    supervisor_review: {
      label: 'Supervisor Review',
      color: 'purple',
      description: 'Eligibility confirmed. Awaiting department supervisor approval.',
    },
    approved: {
      label: 'Approved',
      color: 'green',
      description: 'Application approved! You can now log work hours.',
    },
    rejected: {
      label: 'Rejected',
      color: 'red',
      description: 'Application rejected by supervisor',
    },
  };

  return statusMap[status] || {
    label: status,
    color: 'gray',
    description: 'Unknown status',
  };
}
