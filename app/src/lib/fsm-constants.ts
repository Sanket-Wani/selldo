import { LeadStage } from "@prisma/client";

// -----------------------------------------------------------------------------
// REVERSE-ENGINEERED FINITE STATE MACHINE CONSTANTS & PURE VALIDATOR
// -----------------------------------------------------------------------------

/**
 * Formal Transition Matrix:
 * INCOMING    -> PROSPECT (Contact established), UNQUALIFIED (Non-responsive / Invalid)
 * PROSPECT    -> OPPORTUNITY (High / Medium intent), UNQUALIFIED (Budget Mismatch / Junk)
 * OPPORTUNITY -> BOOKED (Token paid & unit selected), LOST (Competitor / Dropped)
 * BOOKED      -> PROSPECT (Booking cancelled & reopened)
 * UNQUALIFIED -> PROSPECT (Re-engaged via Ad/Campaign), INCOMING (Re-enquiry)
 * LOST        -> PROSPECT (Re-engaged via Campaign)
 */
export const ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  INCOMING: [LeadStage.PROSPECT, LeadStage.UNQUALIFIED],
  PROSPECT: [LeadStage.OPPORTUNITY, LeadStage.UNQUALIFIED],
  OPPORTUNITY: [LeadStage.BOOKED, LeadStage.LOST],
  BOOKED: [LeadStage.PROSPECT],
  UNQUALIFIED: [LeadStage.PROSPECT, LeadStage.INCOMING],
  LOST: [LeadStage.PROSPECT],
};

export const UNQUALIFIED_REASONS = [
  "Budget Mismatch",
  "Location Mismatch",
  "Non-responsive / Not Reachable",
  "Invalid Number",
  "Junk Enquiry",
  "Other",
] as const;

export const LOST_REASONS = [
  "Purchased Competitor Project",
  "Budget Constraint",
  "Postponed Purchase",
  "High Price / No Negotiation",
  "Loan Ineligible",
  "Other",
] as const;

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Pure validation function for verifying stage transition rules.
 */
export function validateLeadTransition(
  currentStage: LeadStage,
  targetStage: LeadStage,
  options?: { reason?: string; subStage?: string | null }
): TransitionValidationResult {
  if (currentStage === targetStage) {
    return {
      valid: false,
      error: `Lead is already in '${currentStage}' stage.`,
    };
  }

  const allowed = ALLOWED_TRANSITIONS[currentStage] || [];
  if (!allowed.includes(targetStage)) {
    return {
      valid: false,
      error: `Invalid transition: Cannot move lead directly from '${currentStage}' to '${targetStage}'. Allowed destinations are: ${allowed.join(", ") || "none"}.`,
    };
  }

  if (targetStage === LeadStage.UNQUALIFIED && (!options?.reason || options.reason.trim() === "")) {
    return {
      valid: false,
      error: `Mandatory reason required when moving lead to UNQUALIFIED. Choose from: ${UNQUALIFIED_REASONS.join(", ")}.`,
    };
  }

  if (targetStage === LeadStage.LOST && (!options?.reason || options.reason.trim() === "")) {
    return {
      valid: false,
      error: `Mandatory reason required when moving lead to LOST. Choose from: ${LOST_REASONS.join(", ")}.`,
    };
  }

  return { valid: true };
}
