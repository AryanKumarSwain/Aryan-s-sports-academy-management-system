import { addMonths } from 'date-fns';

export interface EnrollmentInput {
  sports: { sportId: number; baseFee: number }[];
  planMultiplier: number;
  registrationFee: number;
  additionalCharges: number;
  discount: number;
}

export interface FeeBreakdown {
  sportsFeeTotal: number;
  planAdjustedFee: number;
  registrationFee: number;
  additionalCharges: number;
  discount: number;
  finalFee: number;
  breakdown: { sportId: number; baseFee: number; adjustedFee: number }[];
}

export function calculateFee(input: EnrollmentInput): FeeBreakdown {
  const sportsFeeTotal = input.sports.reduce((sum, s) => sum + s.baseFee, 0);
  const planAdjustedFee = sportsFeeTotal * input.planMultiplier;
  const subtotal = planAdjustedFee + input.registrationFee + input.additionalCharges;
  const finalFee = Math.max(0, subtotal - input.discount);

  return {
    sportsFeeTotal,
    planAdjustedFee,
    registrationFee: input.registrationFee,
    additionalCharges: input.additionalCharges,
    discount: input.discount,
    finalFee,
    breakdown: input.sports.map((s) => ({
      sportId: s.sportId,
      baseFee: s.baseFee,
      adjustedFee: s.baseFee * input.planMultiplier
    }))
  };
}

/** Re-export legacy helper for backward compatibility */
export { calculateEnrollmentFee, computeNextDueDate } from './fees';
