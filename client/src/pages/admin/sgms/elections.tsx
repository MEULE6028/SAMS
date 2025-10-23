import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Vote, Plus } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertElectionSchema } from "@shared/schema";
import { format } from "date-fns";

export default function AdminElectionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: elections, isLoading } = useQuery({
    queryKey: ["/api/admin/sgms/elections"],
  });

  const form = useForm({
    resolver: zodResolver(insertElectionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "upcoming" as const,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sgms/elections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sgms/elections"] });
      toast({
        title: "Election created",
        description: "New election has been scheduled",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Manage Elections</h1>
          <p className="text-muted-foreground mt-2">
            Create and oversee student elections
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue" data-testid="button-create-election">
              <Plus className="h-4 w-4" />
              Create Election
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Election</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Student Body President 2025" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the election..."
                          rows={3}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                    className="bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-election"
                  >
                    Create Election
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Elections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {elections?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-4">
              {elections?.filter((e: any) => e.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-ueab-gold">
              {elections?.reduce((sum: number, e: any) => sum + (e.totalVotes || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : elections && elections.length > 0 ? (
        <div className="grid gap-4">
          {elections.map((election: any) => (
            <Card key={election.id} className="hover-elevate" data-testid={`election-${election.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{election.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{election.description}</p>
                  </div>
                  <Badge
                    className={
                      election.status === "active"
                        ? "bg-chart-4/20 text-chart-4"
                        : election.status === "upcoming"
                        ? "bg-chart-5/20 text-chart-5"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {election.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(election.startDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(election.endDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Candidates</p>
                    <p className="font-medium text-foreground">{election.candidateCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Votes</p>
                    <p className="font-medium text-foreground">{election.totalVotes || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Vote className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No elections yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first election to get started
            </p>
            <Button
              className="bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue"
              onClick={() => setDialogOpen(true)}
              data-testid="button-get-started-elections"
            >
              Create Election
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
