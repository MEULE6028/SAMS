import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus, Upload, Check } from "lucide-react";
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
import { insertHandoverSchema } from "@shared/schema";
import { format } from "date-fns";

export default function HandoversPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: handovers, isLoading } = useQuery({
    queryKey: ["/api/sgms/handovers"],
  });

  const form = useForm({
    resolver: zodResolver(insertHandoverSchema),
    defaultValues: {
      position: "",
      toUserId: "",
      notes: "",
      documentUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sgms/handovers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sgms/handovers"] });
      toast({
        title: "Handover created",
        description: "Handover documentation has been submitted",
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

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/sgms/handovers/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sgms/handovers"] });
      toast({
        title: "Handover completed",
        description: "Handover has been marked as complete",
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
          <h1 className="text-4xl font-bold text-foreground">Leadership Handovers</h1>
          <p className="text-muted-foreground mt-2">
            Document and manage leadership transitions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue" data-testid="button-new-handover">
              <Plus className="h-4 w-4" />
              New Handover
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Handover Document</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Student Body President" data-testid="input-position" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document URL (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-document-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handover Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Key information for the incoming leader..."
                          rows={4}
                          data-testid="input-notes"
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
                    className="bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-handover"
                  >
                    Create Handover
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : handovers && handovers.length > 0 ? (
        <div className="grid gap-4">
          {handovers.map((handover: any) => (
            <Card key={handover.id} className="hover-elevate" data-testid={`handover-${handover.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-ueab-gold/10">
                      <FileText className="h-5 w-5 text-ueab-gold" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{handover.position}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        From: {handover.fromUser?.fullName || "---"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      handover.status === "completed"
                        ? "bg-chart-4/20 text-chart-4"
                        : "bg-chart-5/20 text-chart-5"
                    }
                  >
                    {handover.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {handover.toUser && (
                  <div>
                    <p className="text-sm text-muted-foreground">To:</p>
                    <p className="text-sm font-medium text-foreground">{handover.toUser.fullName}</p>
                  </div>
                )}

                {handover.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm text-foreground">{handover.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Created: {format(new Date(handover.createdAt), "MMM dd, yyyy")}
                    {handover.completedAt && (
                      <> • Completed: {format(new Date(handover.completedAt), "MMM dd, yyyy")}</>
                    )}
                  </div>
                  {handover.documentUrl && (
                    <a
                      href={handover.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-ueab-blue hover:underline"
                    >
                      View Document
                    </a>
                  )}
                </div>

                {handover.status === "pending" && (
                  <Button
                    size="sm"
                    className="w-full bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue"
                    onClick={() => completeMutation.mutate(handover.id)}
                    disabled={completeMutation.isPending}
                    data-testid={`button-complete-${handover.id}`}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No handovers yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create handover documentation for leadership transitions
            </p>
            <Button
              className="bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue"
              onClick={() => setDialogOpen(true)}
              data-testid="button-get-started-handovers"
            >
              Create Handover
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
