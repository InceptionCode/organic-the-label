import { z } from "zod/v4"

export const WorkWithMeProjectTypes = [
  "Collaboration",
  "Mixing & Mastering",
  "Production",
  "Beat Leasing",
  "Production Suite",
  "General",
] as const

export type WorkWithMeProjectType = (typeof WorkWithMeProjectTypes)[number]

export const WorkWithMeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  projectType: z.enum(WorkWithMeProjectTypes),
  message: z.string().min(10, "Message must be at least 10 characters"),
  marketingOptIn: z.boolean().optional().default(false),
})

export type WorkWithMeForm = z.infer<typeof WorkWithMeFormSchema>
