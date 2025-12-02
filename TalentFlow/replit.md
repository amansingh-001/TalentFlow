# TalentFlow - AI-Powered Business Automation for SMEs

## Project Overview
TalentFlow is a comprehensive business automation platform designed specifically for small and medium enterprises (SMEs). The initial focus is on recruiting process automation with AI-powered candidate screening, matching, and pipeline management.

## Current Status
**Phase 3: Integration & Testing** - Complete
- All data models and TypeScript interfaces defined
- Complete frontend component library built with exceptional visual quality
- All backend APIs implemented and connected
- Gemini AI integration working for resume analysis and matching
- Database schema pushed and running
- Drag-and-drop kanban pipeline functional
- Detailed candidate profile with AI insights implemented

## Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Wouter (routing), TanStack Query
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **AI**: Google Gemini 2.5 Flash for resume analysis and candidate matching
- **File Handling**: Multer for resume uploads

## Architecture

### Database Schema
- **jobs**: Job postings with requirements, descriptions, and status
- **candidates**: Candidate profiles with resume data and extracted information
- **applications**: Links candidates to jobs with AI match scores and status tracking
- **interviews**: Scheduled interviews with meeting details

### Key Features Implemented
1. **Dashboard**: Metrics overview with live stats, recent applications, upcoming interviews
2. **Job Management**: Create/view job postings with AI-powered requirements matching
3. **Candidate Management**: Complete candidate profiles with AI-extracted skills and experience
4. **Resume Upload**: Drag-and-drop interface with PDF/DOCX parsing and real-time AI analysis
5. **Pipeline View**: Interactive drag-and-drop kanban board with automatic status updates
6. **Candidate Detail**: Comprehensive profile view with AI match score visualization, matched/missing skills analysis, and reasoning
7. **Interview Scheduling**: Calendar view of scheduled and past interviews with meeting links
8. **Settings**: System configuration and integration status

### API Endpoints (All Implemented)
- GET /api/stats - Dashboard statistics aggregation
- GET /api/jobs - List all jobs with filtering
- GET /api/jobs/:id - Get job details
- POST /api/jobs - Create new job posting
- GET /api/candidates - List all candidates
- GET /api/candidates/:id - Get candidate details
- POST /api/candidates/upload - Upload resume with AI analysis and matching
- GET /api/applications - List all applications
- GET /api/applications/:id - Get application with candidate and job details
- GET /api/applications/recent - Recent applications for dashboard
- GET /api/applications/pipeline - Pipeline view with enriched data
- PATCH /api/applications/:id/status - Update application status (for drag-and-drop)
- GET /api/interviews - List all interviews with details
- Static /uploads/:filename - Serve uploaded resume files

### AI Integration
- Gemini API key configured
- Will be used for:
  - Resume parsing and skill extraction
  - Candidate-to-job matching and scoring
  - Automated candidate ranking

## Design Guidelines
All UI components follow the design_guidelines.md specifications:
- Professional SME-focused aesthetic inspired by Linear and Notion
- Inter font family for exceptional readability
- Consistent spacing using p-6 for cards, gap-4/6/8 for layouts
- Color-coded status badges across the system
- Sidebar navigation with clear hierarchy
- Responsive design with desktop-first approach

## Next Steps
1. Backend implementation with all API endpoints
2. Database setup and migration
3. Gemini AI integration for resume analysis
4. Frontend-backend integration
5. Testing and validation

## Environment Variables
- DATABASE_URL - PostgreSQL connection string
- GEMINI_API_KEY - Google Gemini API key for AI features
- SESSION_SECRET - Express session secret
