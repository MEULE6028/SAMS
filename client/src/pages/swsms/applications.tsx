import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const { toast } = useToast();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["/api/swsms/applications"],
  });

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

  const statusConfig = {
    pending: { icon: Clock, color: "bg-chart-5/20 text-chart-5", label: "Pending" },
    approved: { icon: CheckCircle, color: "bg-chart-4/20 text-chart-4", label: "Approved" },
    rejected: { icon: XCircle, color: "bg-destructive/20 text-destructive", label: "Rejected" },
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

      <div className="grid gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
        ) : applications && applications.length > 0 ? (
          applications.map((app: any) => {
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
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No applications yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start by submitting your first work study application
              </p>
              <Button
                className="bg-ueab-blue hover:bg-ueab-blue-light"
                onClick={() => setDialogOpen(true)}
                data-testid="button-get-started"
              >
                Submit Application
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
