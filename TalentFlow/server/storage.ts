// Blueprint reference: javascript_database
import {
  jobs,
  candidates,
  applications,
  interviews,
  type Job,
  type InsertJob,
  type Candidate,
  type InsertCandidate,
  type Application,
  type InsertApplication,
  type Interview,
  type InsertInterview,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

export interface IStorage {
  // Jobs
  getAllJobs(): Promise<Job[]>;
  getJobById(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;

  // Candidates
  getAllCandidates(): Promise<Candidate[]>;
  getAllCandidatesWithApplications(): Promise<Array<Candidate & { applications: Array<Application & { job: Job }> }>>;
  getCandidateById(id: string): Promise<Candidate | undefined>;
  getCandidateByEmail(email: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;

  // Applications
  getAllApplications(): Promise<Application[]>;
  getApplicationById(id: string): Promise<Application | undefined>;
  getApplicationsByJobId(jobId: string): Promise<Application[]>;
  getApplicationsByCandidateId(candidateId: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: string, status: string): Promise<Application | undefined>;

  // Interviews
  getAllInterviews(): Promise<Interview[]>;
  getInterviewById(id: string): Promise<Interview | undefined>;
  getInterviewsByApplicationId(applicationId: string): Promise<Interview[]>;
  getUpcomingInterviews(): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;

  // Stats
  getStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    totalCandidates: number;
    totalApplications: number;
    interviewsScheduled: number;
    offersExtended: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Jobs
  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJobById(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  // Candidates
  async getAllCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates).orderBy(desc(candidates.createdAt));
  }

  async getAllCandidatesWithApplications(): Promise<
    Array<Candidate & { applications: Array<Application & { job: Job }> }>
  > {
    const candidatesData = await db.select().from(candidates).orderBy(desc(candidates.createdAt));

    const candidatesWithApps = await Promise.all(
      candidatesData.map(async (candidate) => {
        const candidateApplications = await db
          .select({
            application: applications,
            job: jobs,
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .where(eq(applications.candidateId, candidate.id))
          .orderBy(desc(applications.appliedAt));

        return {
          ...candidate,
          applications: candidateApplications.map(({ application, job }) => ({
            ...application,
            job,
          })),
        };
      })
    );

    // Sort candidates by highest match score (candidates with higher match scores first)
    return candidatesWithApps.sort((a, b) => {
      const aMaxScore = Math.max(...a.applications.map((app) => app.matchScore || 0));
      const bMaxScore = Math.max(...b.applications.map((app) => app.matchScore || 0));

      // If one candidate has no applications, put them at the bottom
      if (a.applications.length === 0 && b.applications.length === 0) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Sort by creation date
      }
      if (a.applications.length === 0) return 1;
      if (b.applications.length === 0) return -1;

      // Sort by highest match score (descending)
      return bMaxScore - aMaxScore;
    });
  }

  async getCandidateById(id: string): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate || undefined;
  }

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.email, email));
    return candidate || undefined;
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const [candidate] = await db.insert(candidates).values(insertCandidate).returning();
    return candidate;
  }

  // Applications
  async getAllApplications(): Promise<Application[]> {
    return await db.select().from(applications).orderBy(desc(applications.appliedAt));
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async getApplicationsByJobId(jobId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.jobId, jobId));
  }

  async getApplicationsByCandidateId(candidateId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.candidateId, candidateId));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db.insert(applications).values(insertApplication).returning();
    return application;
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application | undefined> {
    const [application] = await db
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return application || undefined;
  }

  // Interviews
  async getAllInterviews(): Promise<Interview[]> {
    return await db.select().from(interviews).orderBy(interviews.scheduledAt);
  }

  async getInterviewById(id: string): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview || undefined;
  }

  async getInterviewsByApplicationId(applicationId: string): Promise<Interview[]> {
    return await db.select().from(interviews).where(eq(interviews.applicationId, applicationId));
  }

  async getUpcomingInterviews(): Promise<Interview[]> {
    const now = new Date();
    return await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.status, "scheduled"), gte(interviews.scheduledAt, now)))
      .orderBy(interviews.scheduledAt);
  }

  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const [interview] = await db.insert(interviews).values(insertInterview).returning();
    return interview;
  }

  // Stats
  async getStats() {
    const allJobs = await this.getAllJobs();
    const allCandidates = await this.getAllCandidates();
    const allApplications = await this.getAllApplications();
    const allInterviews = await this.getAllInterviews();

    return {
      totalJobs: allJobs.length,
      activeJobs: allJobs.filter((j) => j.status === "active").length,
      totalCandidates: allCandidates.length,
      totalApplications: allApplications.length,
      interviewsScheduled: allInterviews.filter((i) => i.status === "scheduled").length,
      offersExtended: allApplications.filter((a) => a.status === "offer").length,
    };
  }
}

export const storage = new DatabaseStorage();
