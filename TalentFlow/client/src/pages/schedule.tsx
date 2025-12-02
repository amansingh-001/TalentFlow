import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Video } from "lucide-react";

interface InterviewWithDetails {
  id: string;
  scheduledAt: string;
  duration: number;
  interviewerName: string | null;
  meetingLink: string | null;
  status: string;
  candidateName: string;
  jobTitle: string;
}

export default function Schedule() {
  const { data: interviews, isLoading } = useQuery<InterviewWithDetails[]>({
    queryKey: ["/api/interviews"],
  });

  const upcomingInterviews = interviews?.filter(
    i => i.status === "scheduled" && new Date(i.scheduledAt) >= new Date()
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()) || [];

  const pastInterviews = interviews?.filter(
    i => i.status === "completed" || new Date(i.scheduledAt) < new Date()
  ).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()) || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400",
    };
    return colors[status] || colors.scheduled;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Interview Schedule</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-4 w-64 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
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
          <Calendar className="h-8 w-8" />
          Interview Schedule
        </h1>
        <p className="text-muted-foreground mt-2">Manage and track all scheduled interviews</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length > 0 ? (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <Card key={interview.id} className="hover-elevate" data-testid={`interview-${interview.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{interview.candidateName}</h3>
                              <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                            </div>
                            <Badge className={getStatusColor(interview.status)}>
                              {interview.status}
                            </Badge>
                          </div>

                          <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(interview.scheduledAt).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(interview.scheduledAt)} ({interview.duration} minutes)</span>
                            </div>

                            {interview.interviewerName && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Interviewer: {interview.interviewerName}</span>
                              </div>
                            )}

                            {interview.meetingLink && (
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-primary" />
                                <a 
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                  data-testid="link-meeting"
                                >
                                  Join Meeting
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming interviews scheduled</p>
                <p className="text-sm text-muted-foreground mt-2">Scheduled interviews will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {pastInterviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastInterviews.slice(0, 5).map((interview) => (
                  <div 
                    key={interview.id} 
                    className="flex items-center justify-between p-4 border rounded-md"
                    data-testid={`past-interview-${interview.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{interview.candidateName}</p>
                      <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(interview.scheduledAt).toLocaleDateString()} at {formatTime(interview.scheduledAt)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(interview.status)}>
                      {interview.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
