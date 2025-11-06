/**
 * Utility functions for Work Study Management System
 */

/**
 * Generates a unique application ID
 * Format: WS-YYYY-XXXXX (e.g., WS-2025-A1B2C)
 */
export function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  let code = '';

  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `WS-${year}-${code}`;
}

/**
 * Formats an academic semester string for a given date.
 * Rules:
 *  - Sept (8) - Dec (11) => semester 1 of academic year starting that calendar year (e.g., Sept 2025 -> 2025/2026.1)
 *  - Jan (0) - Apr (3) => semester 2 of academic year that started previous Sep (e.g., Jan 2026 -> 2025/2026.2)
 *  - May (4) - Jul (6) => intersemester (3) of academic year that started previous Sep (e.g., May 2026 -> 2025/2026.3)
 */
export function formatAcademicSemester(d?: Date): string {
  const date = d ? new Date(d) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  // Sept - Dec => semester 1 of year/year+1
  if (month >= 8 && month <= 11) {
    return `${year}/${year + 1}.1`;
  }

  // Jan - Apr => semester 2 of previousYear/currentYear
  if (month >= 0 && month <= 3) {
    return `${year - 1}/${year}.2`;
  }

  // May - Jul => intersemester 3 of previousYear/currentYear
  if (month >= 4 && month <= 6) {
    return `${year - 1}/${year}.3`;
  }

  // August or other months default to next academic year's semester 1
  if (month === 7) {
    // treat August as prep for next academic year Sept->Dec (.1)
    return `${year}/${year + 1}.1`;
  }

  return `${year}/${year + 1}.1`;
}

/**
 * Updates work study status in external API
 * Called when supervisor approves an application
 */
export async function updateExternalWorkStudyStatus(
  studentId: string,
  workStudyStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://studedatademo.azurewebsites.net/api/students/${studentId}/work-study-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workStudy: workStudyStatus,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to update external API: ${response.status} - ${errorText}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error updating external API',
    };
  }
}
