import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Vote, CheckCircle2, Users, Trophy, FileText, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";

async function apiRequest(url: string, options?: RequestInit) {
    const token = localStorage.getItem("sams-auth")
        ? JSON.parse(localStorage.getItem("sams-auth") || "{}").state?.token
        : null;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Request failed");
    }

    return response.json();
}

export default function ElectionsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [elections, setElections] = useState<any[]>([]);
    const [selectedElection, setSelectedElection] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});
    const [votedCandidates, setVotedCandidates] = useState<Record<string, string>>({});
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [showVoteConfirm, setShowVoteConfirm] = useState<any>(null);

    useEffect(() => {
        loadElections();
    }, []);

    async function loadElections() {
        try {
            setLoading(true);
            const data = await apiRequest("/api/elections/active");
            setElections(data.elections || []);

            if (data.elections && data.elections.length > 0) {
                await loadCandidates(data.elections[0].id);
                setSelectedElection(data.elections[0]);
            }
        } catch (error: any) {
            console.error("Error loading elections:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function loadCandidates(electionId: string) {
        try {
            const data = await apiRequest(`/api/elections/${electionId}/candidates`);
            setCandidates(data.candidates || []);

            // Group candidates by position
            const groupedPositions = data.candidates.reduce((acc: any, candidate: any) => {
                const positionTitle = candidate.position || "Other";
                if (!acc[positionTitle]) {
                    acc[positionTitle] = {
                        title: positionTitle,
                        positionId: candidate.positionId,
                        candidates: []
                    };
                }
                acc[positionTitle].candidates.push(candidate);
                return acc;
            }, {});

            setPositions(Object.values(groupedPositions));

            // Check if user has voted and get voted candidate IDs
            const voteCheck = await apiRequest(`/api/elections/${electionId}/has-voted`);
            setHasVoted({ ...hasVoted, [electionId]: voteCheck.hasVoted });

            // Build votedCandidates map: positionId -> candidateId
            if (voteCheck.votedCandidateIds && voteCheck.votedCandidateIds.length > 0) {
                const votedMap: Record<string, string> = {};
                voteCheck.votedCandidateIds.forEach((candidateId: string) => {
                    // Find which position this candidate belongs to
                    const candidate = data.candidates.find((c: any) => c.id === candidateId);
                    if (candidate && candidate.positionId) {
                        votedMap[candidate.positionId] = candidateId;
                    }
                });
                setVotedCandidates(votedMap);
            } else if (voteCheck.votedPositionIds && voteCheck.votedPositionIds.length > 0) {
                // Fallback: Use votedPositionIds from API response
                const votedMap: Record<string, string> = {};
                voteCheck.votedPositionIds.forEach((positionId: string) => {
                    // Find the candidate for this position
                    const candidate = data.candidates.find((c: any) =>
                        c.positionId === positionId &&
                        voteCheck.votedCandidateIds.includes(c.id)
                    );
                    if (candidate) {
                        votedMap[positionId] = candidate.id;
                    }
                });
                setVotedCandidates(votedMap);
            }
        } catch (error: any) {
            console.error("Error loading candidates:", error);
        }
    }

    async function handleVote(candidateId: string) {
        try {
            await apiRequest("/api/elections/vote", {
                method: "POST",
                body: JSON.stringify({
                    electionId: selectedElection.id,
                    candidateId,
                }),
            });

            toast({
                title: "Vote Submitted",
                description: "Your vote has been recorded successfully!",
            });

            // Find the candidate to get their position
            const candidate = candidates.find((c: any) => c.id === candidateId);
            if (candidate && candidate.positionId) {
                setVotedCandidates({
                    ...votedCandidates,
                    [candidate.positionId]: candidateId
                });
            }

            setHasVoted({ ...hasVoted, [selectedElection.id]: true });
            setShowVoteConfirm(null);
            loadCandidates(selectedElection.id);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    }

    async function handleApply(formData: any) {
        try {
            await apiRequest("/api/elections/apply", {
                method: "POST",
                body: JSON.stringify({
                    electionId: selectedElection.id,
                    ...formData,
                }),
            });

            toast({
                title: "Application Submitted",
                description: "Your candidacy application has been submitted for review!",
            });

            setShowApplyDialog(false);
            loadCandidates(selectedElection.id);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Student Elections</h1>
                    <p className="text-muted-foreground">Vote for your student leaders</p>
                </div>
                <Button onClick={() => setShowApplyDialog(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Apply as Candidate
                </Button>
            </div>

            {elections.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Vote className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Active Elections</h3>
                        <p className="text-muted-foreground text-center">
                            There are no elections currently running. Check back later!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Election Info Card */}
                    {selectedElection && (
                        <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-2xl">{selectedElection.title}</CardTitle>
                                        <CardDescription className="text-base mt-2">
                                            {selectedElection.description}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={selectedElection.status === "active" ? "default" : "secondary"} className="text-sm">
                                        {selectedElection.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{candidates.length} Candidates</p>
                                            <p className="text-xs text-muted-foreground">Running for positions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Vote Today</p>
                                            <p className="text-xs text-muted-foreground">Your voice matters</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className={`h-5 w-5 ${hasVoted[selectedElection.id] ? "text-green-600" : "text-muted-foreground"}`} />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {hasVoted[selectedElection.id] ? "Voted" : "Not Voted"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {hasVoted[selectedElection.id] ? "Thank you!" : "Cast your vote"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Positions and Candidates */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Positions & Candidates</h2>
                        {positions.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No candidates yet for this election</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {positions.map((position) => {
                                    const positionHasVote = !!votedCandidates[position.positionId];

                                    return (
                                        <Card key={position.title} className="overflow-hidden">
                                            <CardHeader className={cn(
                                                "border-b",
                                                positionHasVote
                                                    ? "bg-gradient-to-r from-green-50 to-emerald-50"
                                                    : "bg-gradient-to-r from-blue-50 to-purple-50"
                                            )}>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            {position.title}
                                                            {positionHasVote && (
                                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                            )}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {position.candidates.length} candidate{position.candidates.length !== 1 ? 's' : ''} running
                                                        </CardDescription>
                                                    </div>
                                                    {positionHasVote && (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Voted
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y">
                                                    {position.candidates.map((candidate: any, index: number) => {
                                                        const isVoted = votedCandidates[position.positionId] === candidate.id;
                                                        const positionHasVote = !!votedCandidates[position.positionId];

                                                        return (
                                                            <button
                                                                key={candidate.id}
                                                                onClick={() => !hasVoted[selectedElection.id] && setShowVoteConfirm(candidate)}
                                                                disabled={hasVoted[selectedElection.id]}
                                                                className={cn(
                                                                    "w-full px-6 py-4 text-left transition-colors flex items-center justify-between group",
                                                                    hasVoted[selectedElection.id]
                                                                        ? "cursor-not-allowed opacity-60"
                                                                        : "hover:bg-blue-50 cursor-pointer",
                                                                    isVoted && "bg-green-50 border-l-4 border-green-500"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm border-2 border-gray-300">
                                                                        {index + 1}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
                                                                        isVoted ? "bg-green-500" : "bg-blue-500 group-hover:bg-blue-600"
                                                                    )}>
                                                                        {isVoted ? (
                                                                            <Check className="h-5 w-5" />
                                                                        ) : (
                                                                            candidate.user?.fullName
                                                                                ?.split(" ")
                                                                                .map((n: string) => n[0])
                                                                                .join("")
                                                                                .toUpperCase() || "??"
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">{candidate.user?.fullName}</p>
                                                                        {isVoted && (
                                                                            <div className="flex items-center gap-1 mt-1">
                                                                                <Check className="h-3 w-3 text-green-600" />
                                                                                <p className="text-xs text-green-600 font-semibold">Your Vote</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {isVoted ? (
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                                                                        <Check className="h-4 w-4 text-green-600" />
                                                                        <span className="text-xs font-semibold text-green-700">Voted</span>
                                                                    </div>
                                                                ) : !hasVoted[selectedElection.id] && (
                                                                    <Vote className="h-4 w-4 text-muted-foreground group-hover:text-blue-600" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Vote Confirmation Dialog */}
            {showVoteConfirm && (
                <Dialog open={!!showVoteConfirm} onOpenChange={() => setShowVoteConfirm(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Your Vote</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to vote for {showVoteConfirm.user?.fullName} for {showVoteConfirm.position}?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-lg">
                                    {showVoteConfirm.user?.fullName
                                        ?.split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold">{showVoteConfirm.user?.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{showVoteConfirm.position}</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                Note: Your vote is final and cannot be changed once submitted.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowVoteConfirm(null)}>
                                Cancel
                            </Button>
                            <Button onClick={() => handleVote(showVoteConfirm.id)}>
                                <Vote className="mr-2 h-4 w-4" />
                                Confirm Vote
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Apply as Candidate Dialog */}
            <CandidateApplicationDialog
                open={showApplyDialog}
                onOpenChange={setShowApplyDialog}
                onSubmit={handleApply}
            />
        </div>
    );
}

function CandidateApplicationDialog({ open, onOpenChange, onSubmit }: any) {
    const [formData, setFormData] = useState({
        position: "",
        manifesto: "",
        qualifications: "",
        visionStatement: "",
        photoUrl: "",
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Apply as Election Candidate</DialogTitle>
                    <DialogDescription>
                        Submit your application to run for a student leadership position
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="position">Position Running For *</Label>
                        <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="president">Student President</SelectItem>
                                <SelectItem value="vice-president">Vice President</SelectItem>
                                <SelectItem value="secretary">Secretary General</SelectItem>
                                <SelectItem value="treasurer">Treasurer</SelectItem>
                                <SelectItem value="sports">Sports Secretary</SelectItem>
                                <SelectItem value="academics">Academics Secretary</SelectItem>
                                <SelectItem value="welfare">Welfare Secretary</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="visionStatement">Vision Statement *</Label>
                        <Textarea
                            id="visionStatement"
                            placeholder="What is your vision for the student body?"
                            value={formData.visionStatement}
                            onChange={(e) => setFormData({ ...formData, visionStatement: e.target.value })}
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label htmlFor="manifesto">Manifesto/Campaign Platform *</Label>
                        <Textarea
                            id="manifesto"
                            placeholder="Describe your plans, policies, and what you'll fight for..."
                            value={formData.manifesto}
                            onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                            rows={6}
                        />
                    </div>

                    <div>
                        <Label htmlFor="qualifications">Qualifications & Experience *</Label>
                        <Textarea
                            id="qualifications"
                            placeholder="List your relevant experience, achievements, and why you're qualified..."
                            value={formData.qualifications}
                            onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label htmlFor="photoUrl">Photo URL (Optional)</Label>
                        <Input
                            id="photoUrl"
                            placeholder="https://example.com/your-photo.jpg"
                            value={formData.photoUrl}
                            onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Provide a professional photo URL for your campaign
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit(formData)}>Submit Application</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
