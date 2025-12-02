import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Calendar, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalJobs: number;
    activeJobs: number;
    totalCandidates: number;
    totalApplications: number;
    interviewsScheduled: number;
    offersExtended: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: recentApplications, isLoading: applicationsLoading } = useQuery<Array<{
    id: string;
    candidateName: string;
    jobTitle: string;
    status: string;
    matchScore: number | null;
    appliedAt: string;
  }>>({
    queryKey: ["/api/applications/recent"],
  });

  const metrics = [
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      total: stats?.totalJobs || 0,
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      testId: "metric-active-jobs",
    },
    {
      title: "Total Candidates",
      value: stats?.totalCandidates || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      testId: "metric-total-candidates",
    },
    {
      title: "Interviews Scheduled",
      value: stats?.interviewsScheduled || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      testId: "metric-interviews",
    },
    {
      title: "Offers Extended",
      value: stats?.offersExtended || 0,
      icon: CheckCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      testId: "metric-offers",
    },
  ];

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

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading your recruitment overview...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold" data-testid="page-title">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your recruitment overview.</p>
        </div>
        <Link href="/jobs/new">
          <Button data-testid="button-create-job">
            <Briefcase className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} data-testid={metric.testId} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`p-2 rounded-md ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`${metric.testId}-value`}>
                {metric.value}
              </div>
              {metric.total !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  of {metric.total} total
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-md animate-pulse">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-48 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentApplications && recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.slice(0, 5).map((app) => (
                  <Link key={app.id} href={`/applications/${app.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-md hover-elevate active-elevate-2" data-testid={`application-${app.id}`}>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{app.candidateName}</p>
                          {app.matchScore !== null && (
                            <Badge variant="outline" className={getMatchScoreColor(app.matchScore)}>
                              {app.matchScore}% Match
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{app.jobTitle}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(app.status)}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No applications yet</p>
                <p className="text-sm text-muted-foreground mt-2">Applications will appear here once candidates start applying</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming interviews</p>
              <p className="text-sm text-muted-foreground mt-2">Scheduled interviews will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
