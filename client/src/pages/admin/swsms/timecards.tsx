import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function AdminTimecardsPage() {
  const { toast } = useToast();

  const { data: timecards, isLoading } = useQuery({
    queryKey: ["/api/admin/swsms/timecards"],
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/swsms/timecards/${id}/verify`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swsms/timecards"] });
      toast({
        title: "Timecard updated",
        description: "The timecard status has been updated",
      });
    },
  });

  const handleVerify = (id: string, status: "verified" | "rejected") => {
    verifyMutation.mutate({ id, status });
  };

  const statusConfig = {
    pending: { color: "bg-chart-5/20 text-chart-5" },
    verified: { color: "bg-chart-4/20 text-chart-4" },
    rejected: { color: "bg-destructive/20 text-destructive" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Timecard Management</h1>
        <p className="text-muted-foreground mt-2">
          Verify and approve student work hours
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-5">
              {timecards?.filter((t: any) => t.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-4">
              {timecards?.filter((t: any) => t.status === "verified").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {timecards?.reduce((sum: number, t: any) => sum + parseFloat(t.hoursWorked || 0), 0).toFixed(1) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : timecards && timecards.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-ueab-blue">All Timecards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-ueab-blue/5">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Position</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Hours</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Task</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timecards.map((card: any, idx: number) => (
                    <tr
                      key={card.id}
                      className={`border-b hover-elevate ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}
                      data-testid={`row-timecard-${card.id}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {card.user?.fullName || "---"}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {format(new Date(card.date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {card.application?.position || "---"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {parseFloat(card.hoursWorked)} hrs
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {card.taskDescription}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            statusConfig[card.status as keyof typeof statusConfig]?.color
                          }
                        >
                          {card.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {card.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-chart-4"
                              onClick={() => handleVerify(card.id, "verified")}
                              disabled={verifyMutation.isPending}
                              data-testid={`button-verify-${card.id}`}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleVerify(card.id, "rejected")}
                              disabled={verifyMutation.isPending}
                              data-testid={`button-reject-${card.id}`}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No timecards to review</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
