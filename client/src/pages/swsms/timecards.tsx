import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Plus, QrCode } from "lucide-react";
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
import { insertTimecardSchema } from "@shared/schema";
import { format } from "date-fns";

export default function TimecardsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: timecards, isLoading } = useQuery({
    queryKey: ["/api/swsms/timecards"],
  });

  const { data: applications } = useQuery({
    queryKey: ["/api/swsms/applications"],
  });

  const approvedApps = applications?.filter((app: any) => app.status === "approved") || [];

  const form = useForm({
    resolver: zodResolver(insertTimecardSchema),
    defaultValues: {
      applicationId: "",
      date: new Date().toISOString().split('T')[0],
      hoursWorked: 0,
      taskDescription: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/swsms/timecards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swsms/timecards"] });
      toast({
        title: "Timecard submitted",
        description: "Your work hours have been logged",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Timecards</h1>
          <p className="text-muted-foreground mt-2">
            Log your work hours and track verification status
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-ueab-blue hover:bg-ueab-blue-light" data-testid="button-log-hours">
              <Plus className="h-4 w-4" />
              Log Hours
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Timecard</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="applicationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Position</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-application">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {approvedApps.map((app: any) => (
                            <SelectItem key={app.id} value={app.id}>
                              {app.position} - {app.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hoursWorked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Worked</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.5"
                          min={0.5}
                          max={12}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-hours-worked"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taskDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the work you completed..."
                          rows={3}
                          data-testid="input-task-description"
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
                    data-testid="button-submit-timecard"
                  >
                    Submit
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : timecards && timecards.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-ueab-blue">Work Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-ueab-blue/5">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Position</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Hours</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Task</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {timecards.map((card: any, idx: number) => (
                    <tr
                      key={card.id}
                      className={`border-b hover-elevate ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}
                      data-testid={`timecard-${card.id}`}
                    >
                      <td className="px-6 py-4 text-sm text-foreground">
                        {format(new Date(card.date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
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
                            card.status === 'verified'
                              ? 'bg-chart-4/20 text-chart-4'
                              : card.status === 'pending'
                              ? 'bg-chart-5/20 text-chart-5'
                              : 'bg-destructive/20 text-destructive'
                          }
                        >
                          {card.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {card.qrCode && (
                          <QrCode className="h-5 w-5 text-ueab-blue" />
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
            <p className="text-lg font-medium text-foreground mb-2">No timecards yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start logging your work hours
            </p>
            {approvedApps.length > 0 ? (
              <Button
                className="bg-ueab-blue hover:bg-ueab-blue-light"
                onClick={() => setDialogOpen(true)}
                data-testid="button-get-started-timecards"
              >
                Log Hours
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                You need an approved work application first
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
