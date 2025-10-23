import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vote, Calendar, Users, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function ElectionsPage() {
  const { toast } = useToast();

  const { data: elections, isLoading } = useQuery({
    queryKey: ["/api/sgms/elections"],
  });

  const voteMutation = useMutation({
    mutationFn: (data: { electionId: string; candidateId: string }) =>
      apiRequest("POST", "/api/sgms/vote", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sgms/elections"] });
      toast({
        title: "Vote recorded",
        description: "Your vote has been successfully cast",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVote = (electionId: string, candidateId: string) => {
    voteMutation.mutate({ electionId, candidateId });
  };

  const statusConfig = {
    upcoming: { color: "bg-chart-5/20 text-chart-5", label: "Upcoming" },
    active: { color: "bg-chart-4/20 text-chart-4", label: "Active" },
    completed: { color: "bg-muted text-muted-foreground", label: "Completed" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Student Elections</h1>
        <p className="text-muted-foreground mt-2">
          Participate in student governance and cast your vote
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      ) : elections && elections.length > 0 ? (
        <div className="grid gap-6">
          {elections.map((election: any) => {
            const status = statusConfig[election.status as keyof typeof statusConfig];

            return (
              <Card key={election.id} className="hover-elevate" data-testid={`election-${election.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{election.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{election.description}</p>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(election.startDate), "MMM dd")} -{" "}
                        {format(new Date(election.endDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{election.candidates?.length || 0} candidates</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {election.candidates && election.candidates.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-ueab-gold">Candidates</h3>
                      <div className="grid gap-4">
                        {election.candidates.map((candidate: any) => (
                          <div
                            key={candidate.id}
                            className="p-4 rounded-md border hover-elevate"
                            data-testid={`candidate-${candidate.id}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-foreground">
                                  {candidate.user?.fullName || "Candidate"}
                                </h4>
                                <p className="text-sm text-ueab-gold">{candidate.position}</p>
                              </div>
                              {election.status === "active" && (
                                <Button
                                  size="sm"
                                  className="bg-ueab-gold hover:bg-ueab-gold-light text-ueab-blue"
                                  onClick={() => handleVote(election.id, candidate.id)}
                                  disabled={voteMutation.isPending || candidate.hasVoted}
                                  data-testid={`button-vote-${candidate.id}`}
                                >
                                  {candidate.hasVoted ? "Voted" : "Vote"}
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {candidate.manifesto}
                            </p>
                            {election.status === "completed" && candidate.voteCount !== undefined && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {candidate.voteCount} votes
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {candidate.votePercentage}%
                                  </span>
                                </div>
                                <Progress value={candidate.votePercentage} className="h-2" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No candidates registered yet
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Vote className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No elections available</p>
            <p className="text-sm text-muted-foreground">
              Check back later for upcoming student elections
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
