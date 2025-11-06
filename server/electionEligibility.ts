/**
 * Election Eligibility Service
 * 
 * Validates voter eligibility for specific election positions based on:
 * - Gender restrictions (male/female/all)
 * - Residence restrictions (oncampus/offcampus/all)
 * - School restrictions (specific school or all)
 */

import { db } from "./db";
import { electionPositions } from "../shared/schema";
import { eq } from "drizzle-orm";
import type { ExternalStudent } from '../client/src/lib/externalAPI';

export interface VoterEligibilityResult {
  eligible: boolean;
  reason?: string;
  restrictions?: {
    gender?: string;
    residence?: string;
    school?: string;
  };
}

/**
 * Check if a voter is eligible to vote for a specific position
 */
export async function checkVoterEligibility(
  positionId: string,
  studentData: ExternalStudent
): Promise<VoterEligibilityResult> {
  try {
    // Get the position with its restrictions
    const [position] = await db
      .select()
      .from(electionPositions)
      .where(eq(electionPositions.id, positionId))
      .limit(1);

    if (!position) {
      return {
        eligible: false,
        reason: "Position not found",
      };
    }

    // Check gender restriction
    if (position.genderRestriction && position.genderRestriction !== 'all') {
      const voterGender = studentData.gender?.toLowerCase();
      const requiredGender = position.genderRestriction;

      if (voterGender !== requiredGender) {
        return {
          eligible: false,
          reason: `This position is only open to ${requiredGender} voters`,
          restrictions: {
            gender: requiredGender,
          },
        };
      }
    }

    // Check residence restriction
    if (position.residenceRestriction && position.residenceRestriction !== 'all') {
      const voterResidence = studentData.residence?.toLowerCase();
      const requiredResidence = position.residenceRestriction;

      // Map residence types: "On-Campus" -> "oncampus", "Off-Campus" -> "offcampus"
      const normalizedResidence = voterResidence?.replace(/[^a-z]/g, '');

      if (normalizedResidence !== requiredResidence) {
        return {
          eligible: false,
          reason: `This position is only open to ${requiredResidence === 'oncampus' ? 'on-campus' : 'off-campus'} students`,
          restrictions: {
            residence: requiredResidence,
          },
        };
      }
    }

    // Check school restriction
    if (position.schoolRestriction) {
      const voterSchool = studentData.school;
      const requiredSchool = position.schoolRestriction;

      if (voterSchool !== requiredSchool) {
        return {
          eligible: false,
          reason: `This position is only open to students from ${requiredSchool}`,
          restrictions: {
            school: requiredSchool,
          },
        };
      }
    }

    // All checks passed
    return {
      eligible: true,
    };

  } catch (error) {
    console.error('Error checking voter eligibility:', error);
    return {
      eligible: false,
      reason: "Error checking eligibility",
    };
  }
}

/**
 * Filter positions that a voter is eligible to vote for
 */
export async function getEligiblePositions(
  positionIds: string[],
  studentData: ExternalStudent
): Promise<string[]> {
  const eligiblePositions: string[] = [];

  for (const positionId of positionIds) {
    const result = await checkVoterEligibility(positionId, studentData);
    if (result.eligible) {
      eligiblePositions.push(positionId);
    }
  }

  return eligiblePositions;
}

/**
 * Get detailed eligibility information for all positions
 */
export async function getPositionEligibilityDetails(
  positionIds: string[],
  studentData: ExternalStudent
): Promise<Map<string, VoterEligibilityResult>> {
  const eligibilityMap = new Map<string, VoterEligibilityResult>();

  for (const positionId of positionIds) {
    const result = await checkVoterEligibility(positionId, studentData);
    eligibilityMap.set(positionId, result);
  }

  return eligibilityMap;
}
