import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GitBranch, Sparkles } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface ApplicationWithDetails {
  id: string;
  status: string;
  matchScore: number | null;
  appliedAt: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobDepartment: string;
}

const statusColumns = [
  { key: "applied", label: "Applied", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" },
  { key: "screening", label: "Screening", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400" },
  { key: "interview", label: "Interview", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400" },
  { key: "offer", label: "Offer", color: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400" },
  { key: "hired", label: "Hired", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" },
];

export default function Pipeline() {
  const { toast } = useToast();
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { data: applications, isLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ["/api/applications/pipeline"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/applications/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status Updated",
        description: "Candidate moved successfully",
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

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedApp(appId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(columnKey);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedApp) {
      updateStatusMutation.mutate({ id: draggedApp, status: newStatus });
    }
    setDraggedApp(null);
    setDragOverColumn(null);
  };

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

  const applicationsByStatus = statusColumns.reduce((acc, column) => {
    acc[column.key] = applications?.filter(app => app.status === column.key) || [];
    return acc;
  }, {} as Record<string, ApplicationWithDetails[]>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Candidate Pipeline</h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => (
            <Card key={column.key} className="min-w-[300px] flex-1">
              <CardHeader>
                <CardTitle className="text-sm">{column.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-3 border rounded-md animate-pulse">
                      <div className="h-4 w-24 bg-muted rounded mb-2" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  ))}
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="page-title">
          <GitBranch className="h-8 w-8" />
          Candidate Pipeline
        </h1>
        <p className="text-muted-foreground mt-2">Track candidates through your recruitment process</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => {
          const columnApplications = applicationsByStatus[column.key];
          const isDragOver = dragOverColumn === column.key;
          
          return (
            <Card 
              key={column.key} 
              className={`min-w-[320px] flex-1 transition-colors ${
                isDragOver ? "bg-accent/50 border-primary" : ""
              }`}
              data-testid={`column-${column.key}`}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide">
                    {column.label}
                  </CardTitle>
                  <Badge variant="secondary" data-testid={`count-${column.key}`}>
                    {columnApplications.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 min-h-[200px]">
                  {columnApplications.length > 0 ? (
                    columnApplications.map((app) => (
                      <Link key={app.id} href={`/applications/${app.id}`}>
                        <Card 
                          className="hover-elevate active-elevate-2 cursor-move"
                          data-testid={`application-card-${app.id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                  {getInitials(app.candidateName)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-medium text-sm truncate">{app.candidateName}</p>
                                  {app.matchScore !== null && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs flex-shrink-0 ${getMatchScoreColor(app.matchScore)}`}
                                      data-testid="match-score"
                                    >
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      {app.matchScore}%
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-xs text-muted-foreground truncate mb-2">
                                  {app.jobTitle}
                                </p>
                                
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{app.jobDepartment}</span>
                                  <span>•</span>
                                  <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      {isDragOver ? "Drop candidate here" : "No candidates in this stage"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
