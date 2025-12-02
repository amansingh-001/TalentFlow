import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Calendar,
  FileText,
  Briefcase,
  GraduationCap,
  Award
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApplicationDetail {
  id: string;
  jobId: string;
  candidateId: string;
  status: string;
  matchScore: number | null;
  aiAnalysis: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    reasoning: string;
  } | null;
  appliedAt: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    resumeUrl: string | null;
    skills: string[] | null;
    experience: string | null;
    education: string | null;
  };
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
    requirements: string[];
  };
}

export default function ApplicationDetail() {
  const [match, params] = useRoute("/applications/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const applicationId = params?.id || null;

  const { data: application, isLoading } = useQuery<ApplicationDetail>({
    queryKey: ["/api/applications", applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch application details");
      }
      return response.json();
    },
    enabled: !!applicationId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/applications/${applicationId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
      screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400",
      interview: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400",
      offer: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
      hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
      rejected: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400",
    };
    return colors[status] || colors.applied;
  };

  if (isLoading || !application) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/pipeline")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pipeline
        </Button>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/pipeline")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pipeline
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Candidate Profile</h1>
          <p className="text-muted-foreground mt-2">
            Applied for {application.job.title}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select
            value={application.status}
            onValueChange={(value) => updateStatusMutation.mutate(value)}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(application.candidate.name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-xl font-bold">{application.candidate.name}</h2>
                {application.candidate.experience && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {application.candidate.experience}
                  </p>
                )}
              </div>

              <div className="w-full space-y-3 pt-4 border-t">
                {application.candidate.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{application.candidate.email}</span>
                  </div>
                )}
                {application.candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{application.candidate.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {application.candidate.resumeUrl && (
                <a
                  href={application.candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full" data-testid="button-view-resume">
                    <FileText className="h-4 w-4 mr-2" />
                    View Resume
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {application.matchScore !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Match Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Match Score</span>
                  <div className={`text-4xl font-bold ${getMatchScoreColor(application.matchScore)}`}>
                    {application.matchScore}%
                  </div>
                </div>

                {application.aiAnalysis && (
                  <>
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {application.aiAnalysis.matchedSkills.map((skill, index) => (
                          <Badge 
                            key={index} 
                            className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {application.aiAnalysis.missingSkills.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Skills Gap
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {application.aiAnalysis.missingSkills.map((skill, index) => (
                            <Badge 
                              key={index}
                              variant="outline"
                              className="text-red-600 dark:text-red-400"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">AI Reasoning</h4>
                      <p className="text-sm text-muted-foreground">
                        {application.aiAnalysis.reasoning}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.candidate.skills && application.candidate.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {application.candidate.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills extracted</p>
              )}
            </CardContent>
          </Card>

          {application.candidate.education && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{application.candidate.education}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Position Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Job Title</p>
                <p className="text-sm text-muted-foreground">{application.job.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Department</p>
                <p className="text-sm text-muted-foreground">{application.job.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Location</p>
                <p className="text-sm text-muted-foreground">{application.job.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {application.job.requirements.map((req, index) => (
                    <Badge key={index} variant="outline">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
