/**
 * Final Fee = Sports Fee + Registration Fee + Additional Charges - Discount
 */
export function calculateEnrollmentFee(input: {
  sportsFee: number;
  registrationFee?: number;
  additionalCharges?: number;
  discount?: number;
}) {
  const registrationFee = input.registrationFee ?? 0;
  const additionalCharges = input.additionalCharges ?? 0;
  const discount = input.discount ?? 0;
  const sportsFee = input.sportsFee;
  const finalFee = Math.max(0, sportsFee + registrationFee + additionalCharges - discount);
  return { sportsFee, registrationFee, additionalCharges, discount, finalFee };
}

export function computeNextDueDate(joiningDate: Date, durationMonths: number) {
  const next = new Date(joiningDate);
  next.setMonth(next.getMonth() + durationMonths);
  return next;
}
