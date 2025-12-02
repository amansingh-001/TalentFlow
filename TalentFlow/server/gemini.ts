// Blueprint reference: javascript_gemini
import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ResumeAnalysis {
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  try {
    const systemPrompt = `You are an expert resume analyzer for recruitment. 
Analyze the resume text and extract structured information.
Respond with JSON in this exact format:
{
  "skills": ["skill1", "skill2", ...],
  "experience": "summary of years and roles",
  "education": "highest education level and field",
  "summary": "brief professional summary"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            skills: {
              type: "array",
              items: { type: "string" }
            },
            experience: { type: "string" },
            education: { type: "string" },
            summary: { type: "string" },
          },
          required: ["skills", "experience", "education", "summary"],
        },
      },
      contents: `Analyze this resume:\n\n${resumeText}`,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: ResumeAnalysis = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    console.error("Resume analysis error:", error);
    throw new Error(`Failed to analyze resume: ${error}`);
  }
}

export interface MatchAnalysis {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

export async function matchCandidateToJob(
  candidateSkills: string[],
  candidateExperience: string,
  jobRequirements: string[],
  jobDescription: string
): Promise<MatchAnalysis> {
  try {
    const systemPrompt = `You are an expert recruitment AI that matches candidates to jobs.
Analyze how well the candidate matches the job requirements.
Provide a match score from 0-100 and detailed analysis.
Respond with JSON in this exact format:
{
  "score": number (0-100),
  "matchedSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "reasoning": "detailed explanation of the match"
}`;

    const prompt = `
Candidate Skills: ${candidateSkills.join(", ")}
Candidate Experience: ${candidateExperience}

Job Requirements: ${jobRequirements.join(", ")}
Job Description: ${jobDescription}

Analyze the match between this candidate and the job.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            matchedSkills: {
              type: "array",
              items: { type: "string" }
            },
            missingSkills: {
              type: "array",
              items: { type: "string" }
            },
            reasoning: { type: "string" },
          },
          required: ["score", "matchedSkills", "missingSkills", "reasoning"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: MatchAnalysis = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    console.error("Match analysis error:", error);
    throw new Error(`Failed to match candidate: ${error}`);
  }
}
