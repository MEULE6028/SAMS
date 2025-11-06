import { useQuery, useMutation } from "@tanstack/react-query";
import { DollarSign, Edit, Save, X, Plus, Trash2, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DepartmentPosition {
  id: string;
  position: string;
  description?: string;
  isActive: boolean;
}

interface DepartmentRate {
  id: string;
  department: string;
  description?: string;
  hourlyRate: string;
  updatedAt: string;
  updatedBy?: string;
  isActive: boolean;
  positions?: DepartmentPosition[];
}

export default function DepartmentRates() {
  const { toast } = useToast();
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<string>("");
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [newDept, setNewDept] = useState({
    department: "",
    description: "",
    hourlyRate: "51",
    positions: [{ position: "", description: "" }],
  });

  const { data, isLoading } = useQuery<{ rates: DepartmentRate[] }>({
    queryKey: ["/api/swsms/department-rates"],
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ department, hourlyRate }: { department: string; hourlyRate: string }) =>
      apiRequest("PUT", `/api/swsms/department-rates/${encodeURIComponent(department)}`, {
        hourlyRate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swsms/department-rates"] });
      toast({
        title: "Rate updated",
        description: "Department hourly rate has been updated successfully",
      });
      setEditingDept(null);
      setNewRate("");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update department rate",
        variant: "destructive",
      });
    },
  });

  const createDeptMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/swsms/department-rates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swsms/department-rates"] });
      toast({
        title: "Department created",
        description: "New department has been created successfully",
      });
      setIsAddDeptOpen(false);
      setNewDept({
        department: "",
        description: "",
        hourlyRate: "51",
        positions: [{ position: "", description: "" }],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create department",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (dept: string, currentRate: string) => {
    setEditingDept(dept);
    setNewRate(currentRate);
  };

  const handleSave = (department: string) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: "Invalid rate",
        description: "Please enter a valid hourly rate greater than 0",
        variant: "destructive",
      });
      return;
    }
    updateRateMutation.mutate({ department, hourlyRate: newRate });
  };

  const handleCancel = () => {
    setEditingDept(null);
    setNewRate("");
  };

  const handleAddPosition = () => {
    setNewDept((prev) => ({
      ...prev,
      positions: [...prev.positions, { position: "", description: "" }],
    }));
  };

  const handleRemovePosition = (index: number) => {
    setNewDept((prev) => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index),
    }));
  };

  const handlePositionChange = (index: number, field: string, value: string) => {
    setNewDept((prev) => ({
      ...prev,
      positions: prev.positions.map((pos, i) =>
        i === index ? { ...pos, [field]: value } : pos
      ),
    }));
  };

  const handleCreateDepartment = () => {
    if (!newDept.department || !newDept.hourlyRate) {
      toast({
        title: "Missing fields",
        description: "Please provide department name and hourly rate",
        variant: "destructive",
      });
      return;
    }

    const rate = parseFloat(newDept.hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: "Invalid rate",
        description: "Please enter a valid hourly rate greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty positions
    const validPositions = newDept.positions.filter((p) => p.position.trim());

    createDeptMutation.mutate({
      ...newDept,
      hourlyRate: rate,
      positions: validPositions,
    });
  };

  const rates = data?.rates || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Department Rates</h1>
          <p className="text-muted-foreground mt-2">
            Manage hourly rates for work study departments
          </p>
        </div>
        <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>
                Create a new department with positions and hourly rate
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department Name *</Label>
                <Input
                  id="department"
                  value={newDept.department}
                  onChange={(e) =>
                    setNewDept((prev) => ({ ...prev, department: e.target.value }))
                  }
                  placeholder="e.g., Research Department"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDept.description}
                  onChange={(e) =>
                    setNewDept((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Brief description of what this department does"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (KSh) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={newDept.hourlyRate}
                  onChange={(e) =>
                    setNewDept((prev) => ({ ...prev, hourlyRate: e.target.value }))
                  }
                  placeholder="51.00"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Positions</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddPosition}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Position
                  </Button>
                </div>
                <div className="space-y-3">
                  {newDept.positions.map((pos, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Position name (e.g., Assistant)"
                                value={pos.position}
                                onChange={(e) =>
                                  handlePositionChange(index, "position", e.target.value)
                                }
                              />
                              <Input
                                placeholder="Position description (optional)"
                                value={pos.description}
                                onChange={(e) =>
                                  handlePositionChange(index, "description", e.target.value)
                                }
                              />
                            </div>
                            {newDept.positions.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemovePosition(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDeptOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateDepartment}
                disabled={createDeptMutation.isPending}
              >
                {createDeptMutation.isPending ? "Creating..." : "Create Department"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hourly Rates by Department</CardTitle>
          <CardDescription>
            Set the hourly wage for each department in the work study program. Total departments: {rates.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : rates.length > 0 ? (
            <div className="space-y-3">
              {rates.map((rate) => (
                <Card key={rate.id} className="border-l-4 border-l-ueab-blue">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-chart-4" />
                            {rate.department}
                          </h3>
                          {rate.positions && rate.positions.length > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {rate.positions.length} position{rate.positions.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        {rate.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {rate.description}
                          </p>
                        )}
                        {editingDept === rate.department ? (
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">KSh</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                className="w-32"
                                placeholder="0.00"
                              />
                              <span className="text-sm text-muted-foreground">/ hour</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSave(rate.department)}
                              disabled={updateRateMutation.isPending}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={updateRateMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-chart-4 mt-1">
                            KSh {parseFloat(rate.hourlyRate).toFixed(2)} / hour
                          </p>
                        )}
                        {rate.positions && rate.positions.length > 0 && (
                          <Accordion type="single" collapsible className="mt-3">
                            <AccordionItem value="positions" className="border-0">
                              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                                View Positions
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 pt-2">
                                  {rate.positions.map((pos) => (
                                    <div
                                      key={pos.id}
                                      className="flex items-start gap-2 p-2 rounded bg-muted/50"
                                    >
                                      <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">{pos.position}</p>
                                        {pos.description && (
                                          <p className="text-xs text-muted-foreground">
                                            {pos.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                      {editingDept !== rate.department && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(rate.department, rate.hourlyRate)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No departments found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">About Department Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• All department rates are set to KSh 51.00 per hour by default</li>
            <li>• Each department can have multiple positions (e.g., Janitor, Secretary, Cook)</li>
            <li>• Rates are applied when timecards are submitted</li>
            <li>• Only verified timecards contribute to student earnings</li>
            <li>• Changes take effect immediately for new timecard submissions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
