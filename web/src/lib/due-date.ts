import { addMonths } from 'date-fns';

export function calculateNextDueDate(joiningDate: Date, durationMonths: number): Date {
  return addMonths(joiningDate, durationMonths);
}
