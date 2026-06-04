import { z } from 'zod';
import { SubscriptionTier } from '@/generated/prisma';

export const academyRegisterSchema = z.object({
  academy_name: z.string().min(2),
  owner_name: z.string().min(2),
  email: z.string().email(),
  phone_number: z.string().min(8).optional(),
  password: z.string().min(6).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  subscription_tier: z.nativeEnum(SubscriptionTier)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['ACADEMY_ADMIN', 'COACH', 'SUPER_ADMIN'])
});

export type AcademyRegisterInput = z.infer<typeof academyRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
