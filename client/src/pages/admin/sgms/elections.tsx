import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Vote, Plus, Edit, Trash2, Users, CheckCircle, XCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertElectionSchema } from "@shared/schema";
import { format } from "date-fns";

export default function AdminElectionsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidatesDialogOpen, setCandidatesDialogOpen] = useState(false);
  const [selectedElection, setSelectedElection] = useState<any>(null);
  const { toast } = useToast();

  const { data: elections, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/sgms/elections"],
  });

  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ["/api/admin/sgms/elections", selectedElection?.id, "candidates"],
    queryFn: () => selectedElection ? apiRequest("GET", `/api/admin/sgms/elections/${selectedElection.id}/candidates`) : null,
    enabled: !!selectedElection && candidatesDialogOpen,
  });

  const candidates = candidatesData?.candidates || [];

  const createForm = useForm({
    resolver: zodResolver(insertElectionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "upcoming" as const,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertElectionSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sgms/elections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sgms/elections"] });
      toast({
        title: "Election created",
        description: "New election has been scheduled",
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/admin/sgms/elections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sgms/elections"] });
      toast({
        title: "Election updated",
        description: "Election details have been saved",
      });
      setEditDialogOpen(false);
      setSelectedElection(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/sgms/elections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sgms/elections"] });
      toast({
        title: "Election deleted",
        description: "The election has been removed",
      });
      setDeleteDialogOpen(false);
      setSelectedElection(null);
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveCandidateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/sgms/candidates/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/sgms/elections", selectedElection?.id, "candidates"]
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sgms/elections"] });
      toast({
        title: "Candidate updated",
        description: "Candidate status has been changed",
      });
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/sgms/candidates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/sgms/elections", selectedElection?.id, "candidates"]
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sgms/elections"] });
      toast({
        title: "Candidate removed",
        description: "The candidate has been deleted",
      });
    },
  });

  const onCreateSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  };

  const onEditSubmit = (data: any) => {
    if (!selectedElection) return;
    updateMutation.mutate({
      id: selectedElection.id,
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  };

  const handleEdit = (election: any) => {
    setSelectedElection(election);
    editForm.reset({
      title: election.title,
      description: election.description,
      startDate: format(new Date(election.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(election.endDate), "yyyy-MM-dd"),
      status: election.status,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (election: any) => {
    setSelectedElection(election);
    setDeleteDialogOpen(true);
  };

  const handleViewCandidates = (election: any) => {
    setSelectedElection(election);
    setCandidatesDialogOpen(true);
  };

  const statusConfig = {
    upcoming: { label: "Upcoming", color: "bg-blue-500/20 text-blue-600" },
    active: { label: "Active", color: "bg-chart-4/20 text-chart-4" },
    completed: { label: "Completed", color: "bg-muted text-muted-foreground" },
  };

  const candidateStatusConfig = {
    pending: { icon: Eye, color: "bg-chart-5/20 text-chart-5", label: "Pending" },
    approved: { icon: CheckCircle, color: "bg-chart-4/20 text-chart-4", label: "Approved" },
    rejected: { icon: XCircle, color: "bg-destructive/20 text-destructive", label: "Rejected" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Manage Elections</h1>
          <p className="text-muted-foreground mt-2">
            Create and oversee student elections (admins cannot vote)
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue">
              <Plus className="h-4 w-4" />
              Create Election
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Election</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Student Body President 2025" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the election..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
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
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue"
                    disabled={createMutation.isPending}
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
          {elections.map((election: any) => {
            const status = statusConfig[election.status as keyof typeof statusConfig];
            return (
              <Card key={election.id} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{election.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{election.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleViewCandidates(election)}
                    >
                      <Users className="h-4 w-4" />
                      View Candidates
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleEdit(election)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(election)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Election
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Election</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue"
                  disabled={updateMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedElection?.title}" and all associated candidates and votes.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedElection && deleteMutation.mutate(selectedElection.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Candidates Dialog */}
      <Dialog open={candidatesDialogOpen} onOpenChange={setCandidatesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidates for {selectedElection?.title}</DialogTitle>
            <DialogDescription>
              Review and manage candidates for this election
            </DialogDescription>
          </DialogHeader>

          {candidatesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : candidates && candidates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate: any) => {
                  const statusInfo = candidateStatusConfig[candidate.status as keyof typeof candidateStatusConfig];
                  const StatusIcon = statusInfo?.icon || Eye;
                  return (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{candidate.user?.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{candidate.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{candidate.position}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo?.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo?.label || candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {candidate.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-chart-4"
                              onClick={() => approveCandidateMutation.mutate({
                                id: candidate.id,
                                status: "approved"
                              })}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Approve
                            </Button>
                          )}
                          {candidate.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive"
                              onClick={() => approveCandidateMutation.mutate({
                                id: candidate.id,
                                status: "rejected"
                              })}
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive"
                            onClick={() => {
                              if (confirm("Delete this candidate?")) {
                                deleteCandidateMutation.mutate(candidate.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No candidates have applied yet
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
