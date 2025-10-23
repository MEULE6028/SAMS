import { useQuery, useMutation } from "@tanstack/react-query";
import { Briefcase, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useState } from "react";

export default function VettingDashboard() {
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: applications, isLoading } = useQuery({
    queryKey: ["/api/admin/swsms/applications"],
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) =>
      apiRequest("PATCH", `/api/swsms/applications/${id}/review`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swsms/applications"] });
      toast({
        title: "Application reviewed",
        description: "The application status has been updated",
      });
    },
  });

  const handleReview = (id: string, status: "approved" | "rejected") => {
    reviewMutation.mutate({
      id,
      status,
      notes: reviewNotes[id] || "",
    });
  };

  const statusConfig = {
    pending: { icon: Clock, color: "bg-chart-5/20 text-chart-5" },
    approved: { icon: CheckCircle, color: "bg-chart-4/20 text-chart-4" },
    rejected: { icon: XCircle, color: "bg-destructive/20 text-destructive" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Vetting Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve work study applications
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-5">
              {applications?.filter((a: any) => a.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-4">
              {applications?.filter((a: any) => a.status === "approved").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {applications?.filter((a: any) => a.status === "rejected").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : applications && applications.length > 0 ? (
        <div className="grid gap-4">
          {applications.map((app: any) => {
            const status = statusConfig[app.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <Card key={app.id} className="hover-elevate" data-testid={`application-${app.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-ueab-blue/10">
                        <Briefcase className="h-5 w-5 text-ueab-blue" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.position}</CardTitle>
                        <p className="text-sm text-muted-foreground">{app.department}</p>
                      </div>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Applicant</p>
                      <p className="text-sm font-medium text-foreground">{app.user?.fullName || "---"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{app.user?.email || "---"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hours per week</p>
                      <p className="text-sm font-medium text-foreground">{app.hoursPerWeek}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Applied</p>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(app.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reason:</p>
                    <p className="text-sm text-foreground">{app.reason}</p>
                  </div>

                  {app.status === "pending" && (
                    <div className="space-y-3 pt-4 border-t">
                      <Textarea
                        placeholder="Add review notes..."
                        value={reviewNotes[app.id] || ""}
                        onChange={(e) =>
                          setReviewNotes({ ...reviewNotes, [app.id]: e.target.value })
                        }
                        rows={2}
                        data-testid={`input-review-notes-${app.id}`}
                      />
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-chart-4 hover:bg-chart-4/80 text-white"
                          onClick={() => handleReview(app.id, "approved")}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-approve-${app.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleReview(app.id, "rejected")}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-reject-${app.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {app.reviewNotes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Review Notes:</p>
                      <p className="text-sm text-foreground">{app.reviewNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No applications to review</p>
            <p className="text-sm text-muted-foreground">
              Applications will appear here when students submit them
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
