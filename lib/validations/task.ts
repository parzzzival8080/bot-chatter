import { z } from "zod";

export const simpleTaskSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export const stressTestTaskSchema = z
  .object({
    platform: z.string().min(1, "Platform is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
    coin: z.string().min(1, "Coin is required"),
    startTime: z.number({ message: "Start time is required" }),
    endTime: z.number({ message: "End time is required" }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type SimpleTaskInput = z.infer<typeof simpleTaskSchema>;
export type StressTestTaskInput = z.infer<typeof stressTestTaskSchema>;
