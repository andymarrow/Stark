import { z } from "zod";

export const projectSchema = z.object({
  type: z.enum(["code", "design", "video"]),
  
  // Link validation based on type
  link: z.string().url("Please enter a valid URL").refine((val) => {
    // Basic logic: if it's code, it should probably be github
    // You can make this stricter later
    return true; 
  }, "Invalid source link"),

  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title is too long (max 50)"),

  description: z
    .string()
    .min(20, "Please provide a more detailed description (min 20 chars)")
    .max(10000, "Description is too long"),

  tags: z.string().optional(),

  demo_link: z.string().url("Invalid URL format").optional().or(z.literal("")),

  files: z
    .array(z.string().url())
    .min(1, "Please add at least one visual asset (screenshot or video)"),

  collaborators: z.array(z.any()).optional(),
});