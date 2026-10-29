import { z } from 'zod'
import { otpTypes } from './confirm-search'

const email = z.email('Please enter a valid email').trim()
const captchaToken = z.string().min(1, 'We could not verify you are human. Please try again.')
const newPassword = z
  .string()
  .trim()
  .min(8, 'Password must be at least 8 characters long.')
  .refine((pw) => /^(?=.*[A-Z])(?=.*[0-9]).+$/.test(pw), 'Password must contain capital letter and a number.')

const passwordsMatch = (v: { password: string; confirmPassword: string }) => v.password === v.confirmPassword
const mismatch = { message: 'Password and confirm password must match', path: ['confirmPassword'] }


export const signInFieldsSchema = z.object({ email, password: z.string().min(1, 'Please enter your password') })
export const signInSchema = signInFieldsSchema.extend({ captchaToken })

const signUpBase = z.object({
  email,
  username: z
    .string()
    .trim()
    .min(1, 'Please choose a username')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username must NOT contain special characters'),
  password: newPassword,
  confirmPassword: z.string().trim(),
})
export const signUpFieldsSchema = signUpBase.refine(passwordsMatch, mismatch)
export const signUpSchema = signUpBase.extend({ captchaToken }).refine(passwordsMatch, mismatch)

export const emailFieldsSchema = z.object({ email })
export const magicLinkSchema = emailFieldsSchema.extend({ captchaToken })
export const resetRequestSchema = emailFieldsSchema.extend({ captchaToken })

export const updatePasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string().trim() })
  .refine(passwordsMatch, mismatch)

export { otpTypes } from './confirm-search'

export const confirmSearchSchema = z.object({
  token_hash: z.string().min(1).optional(),
  type: z.enum(otpTypes).optional(),
  next: z.string().optional(),
})
