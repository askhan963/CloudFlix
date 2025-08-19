import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(100).toLowerCase(),
    password: z.string().min(8).max(128),
    role: z.enum(['creator', 'consumer']),
    email: z.string().email().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    usernameOrEmail: z.string().min(3),
    password: z.string().min(8).max(128)
  })
});
