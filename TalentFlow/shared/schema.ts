import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  employmentType: text("employment_type").notNull(), // Full-time, Part-time, Contract
  description: text("description").notNull(),
  requirements: text("requirements").array().notNull(), // Array of skill requirements
  responsibilities: text("responsibilities").notNull(),
  salaryRange: text("salary_range"),
  status: text("status").notNull().default("active"), // active, closed, draft
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Candidates table
export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"), // Extracted text from resume
  skills: text("skills").array(), // Extracted skills
  experience: text("experience"), // Years of experience or summary
  education: text("education"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

// Applications table (links candidates to jobs)
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("applied"), // applied, screening, interview, offer, hired, rejected
  matchScore: integer("match_score"), // 0-100 AI-generated match score
  aiAnalysis: jsonb("ai_analysis"), // Detailed AI analysis results
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// Interviews table
export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(60), // Duration in minutes
  interviewerName: text("interviewer_name"),
  interviewerEmail: text("interviewer_email"),
  meetingLink: text("meeting_link"),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
});

export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

// Define relations
export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(applications),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}));
