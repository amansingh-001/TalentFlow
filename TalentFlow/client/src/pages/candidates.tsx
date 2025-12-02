import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { Upload, Mail, Phone, Calendar, Users, FileText, Briefcase, CheckSquare, Square } from "lucide-react";
import type { Candidate, Application, Job } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type CandidateWithApplications = Candidate & {
  applications: Array<Application & { job: Job }>;
};

export default function Candidates() {
  const { toast } = useToast();
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isScreeningMode, setIsScreeningMode] = useState(false);

  const { data: candidates, isLoading } = useQuery<CandidateWithApplications[]>({
    queryKey: ["/api/candidates"],
  });

  const moveToScreeningMutation = useMutation({
    mutationFn: async (applicationIds: string[]) => {
      // Move multiple applications to screening stage
      const promises = applicationIds.map((id) =>
        apiRequest("PATCH", `/api/applications/${id}/status`, { status: "screening" })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, applicationIds) => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Candidates Moved to Screening",
        description: `Successfully moved ${applicationIds.length} candidate${
          applicationIds.length > 1 ? "s" : ""
        } to screening stage.`,
      });
      setSelectedCandidates(new Set());
      setIsScreeningMode(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Moving Candidates",
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

  const handleCandidateSelection = (candidateId: string, checked: boolean) => {
    const newSelected = new Set(selectedCandidates);
    if (checked) {
      newSelected.add(candidateId);
    } else {
      newSelected.delete(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSelectAll = () => {
    if (!candidates) return;

    if (selectedCandidates.size === candidates.length) {
      // Deselect all
      setSelectedCandidates(new Set());
    } else {
      // Select all eligible candidates (those with applications in "applied" status)
      const eligibleCandidates = candidates.filter((candidate) =>
        candidate.applications.some((app) => app.status === "applied")
      );
      setSelectedCandidates(new Set(eligibleCandidates.map((c) => c.id)));
    }
  };

  const handleMoveToScreening = () => {
    if (!candidates || selectedCandidates.size === 0) return;

    // Get all application IDs for selected candidates that are in "applied" status
    const applicationIds: string[] = [];

    candidates.forEach((candidate) => {
      if (selectedCandidates.has(candidate.id)) {
        candidate.applications.forEach((app) => {
          if (app.status === "applied") {
            applicationIds.push(app.id);
          }
        });
      }
    });

    if (applicationIds.length === 0) {
      toast({
        title: "No Eligible Applications",
        description: "Selected candidates don't have applications in 'applied' status.",
        variant: "destructive",
      });
      return;
    }

    moveToScreeningMutation.mutate(applicationIds);
  };

  // Get candidates that are eligible for screening (have applications in "applied" status)
  const eligibleCandidatesCount =
    candidates?.filter((candidate) => candidate.applications.some((app) => app.status === "applied")).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Candidates</h1>
          <Button disabled>
            <Upload className="h-4 w-4 mr-2" />
            Upload Resume
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-muted rounded" />
                    <div className="h-4 w-64 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">
            Candidates
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all candidates in your talent pool • Sorted by highest match score
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isScreeningMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsScreeningMode(true)}
                disabled={eligibleCandidatesCount === 0}
                data-testid="button-start-screening"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select for Screening
              </Button>
              <Link href="/candidates/upload">
                <Button data-testid="button-upload-resume">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resume
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsScreeningMode(false);
                  setSelectedCandidates(new Set());
                }}
                data-testid="button-cancel-screening"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMoveToScreening}
                disabled={selectedCandidates.size === 0 || moveToScreeningMutation.isPending}
                data-testid="button-move-to-screening"
              >
                {moveToScreeningMutation.isPending ? "Moving..." : `Move ${selectedCandidates.size} to Screening`}
              </Button>
            </>
          )}
        </div>
      </div>

      {isScreeningMode && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedCandidates.size === eligibleCandidatesCount && eligibleCandidatesCount > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm font-medium">Select All Eligible ({eligibleCandidatesCount} candidates)</span>
              </div>
              <Badge variant="secondary">{selectedCandidates.size} selected</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Select candidates with applications in "applied" status to move them to screening stage.
            </p>
          </CardContent>
        </Card>
      )}

      {candidates && candidates.length > 0 ? (
        <div className="grid gap-4">
          {candidates.map((candidate) => (
            <Card
              key={candidate.id}
              className="hover-elevate active-elevate-2"
              data-testid={`candidate-card-${candidate.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {isScreeningMode && (
                    <div className="flex items-center pt-1">
                      <Checkbox
                        checked={selectedCandidates.has(candidate.id)}
                        onCheckedChange={(checked) => handleCandidateSelection(candidate.id, checked === true)}
                        disabled={!candidate.applications.some((app) => app.status === "applied")}
                        data-testid={`checkbox-candidate-${candidate.id}`}
                      />
                    </div>
                  )}
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getInitials(candidate.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{candidate.name}</h3>
                        {candidate.experience && (
                          <p className="text-sm text-muted-foreground">{candidate.experience}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      {candidate.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{candidate.email}</span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Added {new Date(candidate.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Applications */}
                    {candidate.applications && candidate.applications.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          Applied for {candidate.applications.length} position
                          {candidate.applications.length > 1 ? "s" : ""}
                        </h4>
                        <div className="space-y-2">
                          {candidate.applications.map((application) => (
                            <div
                              key={application.id}
                              className="flex items-center justify-between p-2 bg-muted rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{application.job.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {application.job.department}
                                </Badge>
                                <Badge
                                  variant={
                                    application.status === "hired"
                                      ? "default"
                                      : application.status === "rejected"
                                      ? "destructive"
                                      : application.status === "interview"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className={`text-xs ${
                                    application.status === "applied" && isScreeningMode
                                      ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                      : ""
                                  }`}
                                >
                                  {application.status}
                                  {application.status === "applied" && isScreeningMode && (
                                    <span className="ml-1 text-blue-600">• Eligible</span>
                                  )}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {application.matchScore && (
                                  <span
                                    className={`font-medium ${
                                      application.matchScore >= 80
                                        ? "text-green-600"
                                        : application.matchScore >= 60
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {application.matchScore}% match
                                  </span>
                                )}
                                <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.slice(0, 8).map((skill, index) => (
                          <Badge key={index} variant="secondary" data-testid={`skill-${index}`}>
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 8 && (
                          <Badge variant="outline">+{candidate.skills.length - 8} more</Badge>
                        )}
                      </div>
                    )}

                    {candidate.resumeUrl && (
                      <div className="mt-3 pt-3 border-t">
                        <a
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                          data-testid="link-resume"
                        >
                          <FileText className="h-4 w-4" />
                          View Resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No candidates yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start building your talent pool by uploading candidate resumes. Our AI will automatically extract skills
              and experience.
            </p>
            <Link href="/candidates/upload">
              <Button data-testid="button-upload-first-resume">
                <Upload className="h-4 w-4 mr-2" />
                Upload First Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
