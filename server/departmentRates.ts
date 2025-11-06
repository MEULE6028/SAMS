import { db } from "./db";
import { departmentRates, departmentPositions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Department Hourly Rates Configuration
 * Defines the hourly wage for each department in the work study program
 * Note: These are fallback values. Actual rates are stored in the database.
 */

export const DEPARTMENT_RATES: Record<string, number> = {
  "Library": 51, // KSh per hour
  "IT Services": 51,
  "Admissions": 51,
  "Facilities": 51,
  "Student Affairs": 51,
  "Cafeteria": 51,
  "Security": 51,
  "Maintenance": 51,
  "Administration": 51,
  "Chapel": 51,
  "Sports": 51,
  "Health Center": 51,
};

/**
 * Get the hourly rate for a department from database
 * @param department - Department name
 * @returns Hourly rate in KSh, or default 51 KSh if not found
 */
export async function getDepartmentRate(department: string): Promise<number> {
  try {
    const result = await db.select()
      .from(departmentRates)
      .where(eq(departmentRates.department, department))
      .limit(1);

    if (result.length > 0 && result[0].hourlyRate) {
      return Number(result[0].hourlyRate);
    }
  } catch (error) {
    console.error(`Error fetching rate for ${department}:`, error);
  }

  // Fallback to hardcoded rates or default
  return DEPARTMENT_RATES[department] || 51; // Default 51 KSh/hour
}

/**
 * Get all department rates with positions from database
 * @returns Array of department rates with their positions
 */
export async function getAllDepartmentRates() {
  try {
    const rates = await db.select().from(departmentRates).where(eq(departmentRates.isActive, true));

    // Get positions for each department
    const ratesWithPositions = await Promise.all(
      rates.map(async (rate) => {
        const positions = await db.select()
          .from(departmentPositions)
          .where(eq(departmentPositions.departmentId, rate.id));

        return {
          ...rate,
          positions: positions,
        };
      })
    );

    return ratesWithPositions;
  } catch (error) {
    console.error("Error fetching department rates:", error);
    // Return fallback rates as array
    return Object.entries(DEPARTMENT_RATES).map(([department, hourlyRate]) => ({
      id: department,
      department,
      hourlyRate: String(hourlyRate),
      description: null,
      isActive: true,
      positions: [],
    }));
  }
}

/**
 * Get positions for a specific department
 * @param departmentId - Department ID
 * @returns Array of positions
 */
export async function getDepartmentPositions(departmentId: string) {
  try {
    const positions = await db.select()
      .from(departmentPositions)
      .where(eq(departmentPositions.departmentId, departmentId));
    return positions;
  } catch (error) {
    console.error(`Error fetching positions for department ${departmentId}:`, error);
    return [];
  }
}

/**
 * Create a new department
 * @param data - Department data
 * @param userId - ID of user creating the department
 * @returns Created department
 */
export async function createDepartment(
  data: { department: string; description?: string; hourlyRate: number },
  userId: string
) {
  const [result] = await db.insert(departmentRates)
    .values({
      department: data.department,
      description: data.description,
      hourlyRate: String(data.hourlyRate),
      isActive: true,
      updatedBy: userId,
    })
    .returning();

  return result;
}

/**
 * Add a position to a department
 * @param departmentId - Department ID
 * @param position - Position name
 * @param description - Position description
 * @returns Created position
 */
export async function addDepartmentPosition(
  departmentId: string,
  position: string,
  description?: string
) {
  const [result] = await db.insert(departmentPositions)
    .values({
      departmentId,
      position,
      description,
      isActive: true,
    })
    .returning();

  return result;
}

/**
 * Update department rate
 * @param department - Department name
 * @param newRate - New hourly rate
 * @param userId - ID of user making the update
 */
export async function updateDepartmentRate(
  department: string,
  newRate: number,
  userId: string
) {
  const [result] = await db.update(departmentRates)
    .set({
      hourlyRate: String(newRate),
      updatedBy: userId,
      updatedAt: new Date()
    })
    .where(eq(departmentRates.department, department))
    .returning();

  return result;
}

/**
 * Delete a department (soft delete by setting isActive to false)
 * @param departmentId - Department ID
 */
export async function deleteDepartment(departmentId: string) {
  const [result] = await db.update(departmentRates)
    .set({ isActive: false })
    .where(eq(departmentRates.id, departmentId))
    .returning();

  return result;
}

/**
 * Delete a position (soft delete by setting isActive to false)
 * @param positionId - Position ID
 */
export async function deletePosition(positionId: string) {
  const [result] = await db.update(departmentPositions)
    .set({ isActive: false })
    .where(eq(departmentPositions.id, positionId))
    .returning();

  return result;
}

/**
 * Calculate earnings for a timecard
 * @param hours - Number of hours worked
 * @param department - Department name
 * @returns Total earnings in KSh
 */
export async function calculateEarnings(hours: number, department: string): Promise<number> {
  const rate = await getDepartmentRate(department);
  return Number((hours * rate).toFixed(2));
}
