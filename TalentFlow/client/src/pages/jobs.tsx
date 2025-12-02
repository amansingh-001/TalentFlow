import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Briefcase, MapPin, Clock, DollarSign, Plus, Users } from "lucide-react";
import type { Job } from "@shared/schema";

export default function Jobs() {
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400",
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400",
    };
    return colors[status] || colors.active;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Job Openings</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold" data-testid="page-title">Job Openings</h1>
          <p className="text-muted-foreground mt-2">Manage your job postings and track applications</p>
        </div>
        <Link href="/jobs/new">
          <Button data-testid="button-create-job">
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </Link>
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="h-full hover-elevate active-elevate-2" data-testid={`job-card-${job.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.department}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{job.employmentType}</span>
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>{job.salaryRange}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-medium pt-2 border-t">
                    <Users className="h-4 w-4" />
                    <span>View Applications</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No job openings yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Get started by creating your first job posting. Attract top talent with AI-powered candidate screening.
            </p>
            <Link href="/jobs/new">
              <Button data-testid="button-create-first-job">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
