import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Plus, Clock, CheckCircle, XCircle, AlertCircle, FileText, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertWorkApplicationSchema } from "@shared/schema";
import { format } from "date-fns";

export default function WorkApplicationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appealReason, setAppealReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/swsms/applications"],
  });

  const applications = data?.applications || [];

  const form = useForm({
    resolver: zodResolver(insertWorkApplicationSchema),
    defaultValues: {
      department: "",
      position: "",
      hoursPerWeek: 10,
      reason: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/swsms/applications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swsms/applications"] });
      toast({
        title: "Application submitted",
        description: "Your work study application has been submitted for review",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const appealMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("POST", `/api/swsms/applications/${id}/appeal`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swsms/applications"] });
      toast({
        title: "Appeal submitted",
        description: "Your appeal has been submitted for review",
      });
      setAppealDialogOpen(false);
      setAppealReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Appeal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAppealSubmit = () => {
    if (!selectedApp || !appealReason.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide a reason for your appeal",
        variant: "destructive",
      });
      return;
    }
    appealMutation.mutate({ id: selectedApp.id, reason: appealReason });
  };

  const handleCardClick = (app: any) => {
    setSelectedApp(app);
    setDetailDialogOpen(true);
  };

  const statusConfig = {
    pending: { icon: Clock, color: "bg-chart-5/20 text-chart-5", label: "Pending" },
    approved: { icon: CheckCircle, color: "bg-chart-4/20 text-chart-4", label: "Approved" },
    rejected: { icon: XCircle, color: "bg-destructive/20 text-destructive", label: "Rejected" },
  };

  const filteredApplications = applications?.filter((app: any) => {
    if (statusFilter === "all") return true;
    return app.status === statusFilter;
  }) || [];

  const getCountByStatus = (status: string) => {
    if (status === "all") return applications?.length || 0;
    return applications?.filter((app: any) => app.status === status).length || 0;
  };

  const parseEligibilityDetails = (details: any) => {
    if (!details) return null;
    try {
      return typeof details === 'string' ? JSON.parse(details) : details;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Work Study Applications</h1>
          <p className="text-muted-foreground mt-2">
            Apply for work study positions and track your applications
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-ueab-blue hover:bg-ueab-blue-light" data-testid="button-new-application">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Work Study Application</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Library">Library</SelectItem>
                          <SelectItem value="IT Services">IT Services</SelectItem>
                          <SelectItem value="Admissions">Admissions</SelectItem>
                          <SelectItem value="Facilities">Facilities</SelectItem>
                          <SelectItem value="Student Affairs">Student Affairs</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Library Assistant" data-testid="input-position" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hoursPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Per Week</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={5}
                          max={20}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-hours"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Application</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Explain why you're interested in this position..."
                          rows={4}
                          data-testid="input-reason"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-ueab-blue hover:bg-ueab-blue-light"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-application"
                  >
                    Submit Application
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1 text-xs">
              {getCountByStatus("all")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            <Badge variant="secondary" className="ml-1 text-xs bg-chart-5/20">
              {getCountByStatus("pending")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Approved
            <Badge variant="secondary" className="ml-1 text-xs bg-chart-4/20">
              {getCountByStatus("approved")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Rejected
            <Badge variant="secondary" className="ml-1 text-xs bg-destructive/20">
              {getCountByStatus("rejected")}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
        ) : filteredApplications.length > 0 ? (
          filteredApplications.map((app: any) => {
            const status = statusConfig[app.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            const isRejected = app.status === "rejected";

            return (
              <Card
                key={app.id}
                className={`hover-elevate ${isRejected ? 'cursor-pointer' : ''}`}
                onClick={() => isRejected && handleCardClick(app)}
                data-testid={`application-${app.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-ueab-blue/10">
                        <Briefcase className="h-5 w-5 text-ueab-blue" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.position}</CardTitle>
                        <p className="text-sm text-muted-foreground">{app.department}</p>
                        {app.applicationId && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            ID: {app.applicationId}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Hours per week:</span>{" "}
                        <span className="font-medium text-foreground">{app.hoursPerWeek}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applied:</span>{" "}
                        <span className="font-medium text-foreground">
                          {format(new Date(app.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Reason:</p>
                      <p className="text-sm text-foreground">{app.reason}</p>
                    </div>
                    {app.reviewNotes && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-1">Review Notes:</p>
                        <p className="text-sm text-foreground">{app.reviewNotes}</p>
                      </div>
                    )}
                    {isRejected && (
                      <div className="pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-ueab-blue"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(app);
                          }}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          View Details & Appeal
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                {statusFilter === "all" ? "No applications yet" : `No ${statusFilter} applications`}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter === "all"
                  ? "Start by submitting your first work study application"
                  : "Applications will appear here based on their status"
                }
              </p>
              {statusFilter === "all" && (
                <Button
                  className="bg-ueab-blue hover:bg-ueab-blue-light"
                  onClick={() => setDialogOpen(true)}
                  data-testid="button-get-started"
                >
                  Submit Application
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Application Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              {/* Application ID - Prominent Display */}
              <div className="p-4 bg-ueab-blue/5 rounded-lg border border-ueab-blue/20">
                <p className="text-sm text-muted-foreground mb-1">Application ID</p>
                <p className="text-lg font-mono font-bold text-ueab-blue">
                  {selectedApp.applicationId || "N/A"}
                </p>
              </div>

              {/* Application Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Position</p>
                  <p className="text-sm font-medium text-foreground">{selectedApp.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="text-sm font-medium text-foreground">{selectedApp.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hours per Week</p>
                  <p className="text-sm font-medium text-foreground">{selectedApp.hoursPerWeek}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge className={statusConfig[selectedApp.status as keyof typeof statusConfig].color}>
                    {selectedApp.status}
                  </Badge>
                </div>
              </div>

              {/* Eligibility Check Results */}
              {selectedApp.eligibilityDetails && (
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-ueab-blue" />
                    <h3 className="font-semibold text-foreground">Eligibility Check Results</h3>
                  </div>
                  {(() => {
                    const details = parseEligibilityDetails(selectedApp.eligibilityDetails);
                    if (!details || !details.checks) {
                      return <p className="text-sm text-muted-foreground">No eligibility data available</p>;
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-background rounded border">
                          <div className="flex items-center gap-2">
                            {details.checks.semesterCompletion?.passed ? (
                              <CheckCircle className="h-4 w-4 text-chart-4" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-sm font-medium">Semester Completion</span>
                          </div>
                          <span className={`text-xs ${details.checks.semesterCompletion?.passed ? 'text-chart-4' : 'text-destructive'}`}>
                            {details.checks.semesterCompletion?.message || "Check failed"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-background rounded border">
                          <div className="flex items-center gap-2">
                            {details.checks.feeBalance?.passed ? (
                              <CheckCircle className="h-4 w-4 text-chart-4" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-sm font-medium">Fee Balance</span>
                          </div>
                          <span className={`text-xs ${details.checks.feeBalance?.passed ? 'text-chart-4' : 'text-destructive'}`}>
                            {details.checks.feeBalance?.message || "Check failed"}
                          </span>
                        </div>

                        <div className="mt-3 p-3 bg-background/50 rounded">
                          <p className="text-xs text-muted-foreground">
                            <strong>Overall:</strong> {details.eligible ? "Eligible" : "Not Eligible"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Review Notes */}
              {selectedApp.reviewNotes && (
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <p className="text-sm text-muted-foreground mb-2">Rejection Reason</p>
                  <p className="text-sm text-foreground">{selectedApp.reviewNotes}</p>
                </div>
              )}

              {/* Appeal Button */}
              {selectedApp.status === "rejected" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDetailDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-ueab-blue hover:bg-ueab-blue-light"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setAppealDialogOpen(true);
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Submit Appeal
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appeal Dialog */}
      <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Appeal</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Application ID</p>
                <p className="text-sm font-mono font-medium text-foreground">
                  {selectedApp.applicationId || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedApp.position} - {selectedApp.department}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Reason for Appeal <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why you believe this application should be reconsidered..."
                  rows={6}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {appealReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAppealDialogOpen(false);
                    setAppealReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-ueab-blue hover:bg-ueab-blue-light"
                  onClick={handleAppealSubmit}
                  disabled={appealMutation.isPending || !appealReason.trim()}
                >
                  {appealMutation.isPending ? "Submitting..." : "Submit Appeal"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
