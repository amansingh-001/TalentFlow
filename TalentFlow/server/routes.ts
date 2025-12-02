import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { analyzeResume, matchCandidateToJob } from "./gemini";
import { insertJobSchema, insertCandidateSchema, insertApplicationSchema } from "@shared/schema";
// @ts-ignore - pdf-parse is a CommonJS module
import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";

// Handle CommonJS default export
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper function to extract text from PDF
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return "";
  }
}

// Helper function to extract text from DOCX
async function extractTextFromDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Jobs endpoints
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Candidates endpoints
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getAllCandidatesWithApplications();
      res.json(candidates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const candidate = await storage.getCandidateById(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      res.json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resume upload and AI analysis endpoint
  app.post("/api/candidates/upload", upload.single("resume"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No resume file uploaded" });
      }

      const { name, email, phone, jobId } = req.body;

      if (!name || !email || !jobId) {
        return res.status(400).json({ error: "Name, email, and job are required" });
      }

      // Check if candidate already exists
      let candidate = await storage.getCandidateByEmail(email);

      // Extract text from resume
      const ext = path.extname(req.file.filename).toLowerCase();
      let resumeText = "";

      try {
        if (ext === ".pdf") {
          resumeText = await extractTextFromPDF(req.file.path);
        } else if (ext === ".docx") {
          resumeText = await extractTextFromDOCX(req.file.path);
        }
      } catch (parseError: any) {
        console.error("Resume parsing error:", parseError);
        return res.status(400).json({ error: "Failed to parse resume file" });
      }

      // Analyze resume with AI
      let analysis;
      try {
        analysis = await analyzeResume(resumeText);
      } catch (aiError: any) {
        console.error("AI analysis error:", aiError);
        // Continue without AI analysis if it fails
        analysis = {
          skills: [],
          experience: "Not analyzed",
          education: "Not analyzed",
          summary: "AI analysis unavailable",
        };
      }

      // Create or update candidate
      if (!candidate) {
        candidate = await storage.createCandidate({
          name,
          email,
          phone: phone || null,
          resumeUrl: `/uploads/${req.file.filename}`,
          resumeText,
          skills: analysis.skills,
          experience: analysis.experience,
          education: analysis.education,
        });
      }

      // Get job details for matching
      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Match candidate to job with AI
      let matchScore = null;
      let aiAnalysis = null;

      try {
        const matchResult = await matchCandidateToJob(
          analysis.skills,
          analysis.experience,
          job.requirements,
          job.description
        );
        matchScore = Math.round(matchResult.score);
        aiAnalysis = matchResult;
      } catch (matchError: any) {
        console.error("Match analysis error:", matchError);
      }

      // Create application
      const application = await storage.createApplication({
        jobId,
        candidateId: candidate.id,
        status: "applied",
        matchScore,
        aiAnalysis: aiAnalysis as any,
      });

      res.status(201).json({
        candidate,
        application,
        analysis,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Applications endpoints
  app.get("/api/applications", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Specific routes must come BEFORE parameterized routes
  app.get("/api/applications/recent", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      const jobs = await storage.getAllJobs();
      const candidates = await storage.getAllCandidates();

      const jobsMap = new Map(jobs.map((j) => [j.id, j]));
      const candidatesMap = new Map(candidates.map((c) => [c.id, c]));

      const recent = applications.slice(0, 10).map((app) => {
        const job = jobsMap.get(app.jobId);
        const candidate = candidatesMap.get(app.candidateId);
        return {
          id: app.id,
          candidateName: candidate?.name || "Unknown",
          jobTitle: job?.title || "Unknown",
          status: app.status,
          matchScore: app.matchScore,
          appliedAt: app.appliedAt,
        };
      });

      res.json(recent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/applications/pipeline", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      const jobs = await storage.getAllJobs();
      const candidates = await storage.getAllCandidates();

      const jobsMap = new Map(jobs.map((j) => [j.id, j]));
      const candidatesMap = new Map(candidates.map((c) => [c.id, c]));

      const pipeline = applications.map((app) => {
        const job = jobsMap.get(app.jobId);
        const candidate = candidatesMap.get(app.candidateId);
        return {
          id: app.id,
          status: app.status,
          matchScore: app.matchScore,
          appliedAt: app.appliedAt,
          candidateName: candidate?.name || "Unknown",
          candidateEmail: candidate?.email || "",
          jobTitle: job?.title || "Unknown",
          jobDepartment: job?.department || "Unknown",
        };
      });

      res.json(pipeline);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Parameterized routes come AFTER specific routes
  app.get("/api/applications/:id", async (req, res) => {
    try {
      const application = await storage.getApplicationById(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const candidate = await storage.getCandidateById(application.candidateId);
      const job = await storage.getJobById(application.jobId);

      if (!candidate || !job) {
        return res.status(404).json({ error: "Related data not found" });
      }

      res.json({
        ...application,
        candidate,
        job,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const application = await storage.updateApplicationStatus(req.params.id, status);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Interviews endpoints
  app.get("/api/interviews", async (req, res) => {
    try {
      const interviews = await storage.getAllInterviews();
      const applications = await storage.getAllApplications();
      const jobs = await storage.getAllJobs();
      const candidates = await storage.getAllCandidates();

      const appsMap = new Map(applications.map((a) => [a.id, a]));
      const jobsMap = new Map(jobs.map((j) => [j.id, j]));
      const candidatesMap = new Map(candidates.map((c) => [c.id, c]));

      const enriched = interviews.map((interview) => {
        const app = appsMap.get(interview.applicationId);
        const job = app ? jobsMap.get(app.jobId) : undefined;
        const candidate = app ? candidatesMap.get(app.candidateId) : undefined;

        return {
          ...interview,
          candidateName: candidate?.name || "Unknown",
          jobTitle: job?.title || "Unknown",
        };
      });

      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve uploaded files
  app.use(
    "/uploads",
    (req, res, next) => {
      res.setHeader("Content-Type", "application/pdf");
      next();
    },
    (req, res, next) => {
      const filePath = path.join(uploadDir, path.basename(req.path));
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({ error: "File not found" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
