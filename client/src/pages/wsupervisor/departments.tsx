import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Building2, Users, Clock, DollarSign, ChevronDown, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Department {
  department: string;
  hourlyRate: number;
  workerCount: number;
  pendingTimecards: number;
}

interface Worker {
  userId: number;
  fullName: string;
  email: string;
  position: string;
  hoursPerWeek: number;
  totalHours: string;
  totalEarnings: string;
  pendingTimecards: number;
}

const ITEMS_PER_PAGE = 8;

export default function WSupervisorDepartments() {
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data: departmentsData, isLoading: departmentsLoading } = useQuery<{ departments: Department[] }>({
    queryKey: ["/api/wsupervisor/departments"],
    queryFn: () => apiRequest("GET", "/api/wsupervisor/departments")
  });

  const { data: workersData, isLoading: workersLoading } = useQuery<{ workers: Worker[] }>({
    queryKey: ["/api/wsupervisor/departments", expandedDepartment, "workers"],
    queryFn: () => apiRequest("GET", `/api/wsupervisor/departments/${expandedDepartment}/workers`),
    enabled: !!expandedDepartment
  });

  const departments = departmentsData?.departments || [];
  const workers = workersData?.workers || [];

  // Pagination logic for departments
  const totalPages = Math.ceil(departments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDepartments = departments.slice(startIndex, endIndex);

  const toggleDepartment = (dept: string) => {
    setExpandedDepartment(expandedDepartment === dept ? null : dept);
  };

  const totalWorkers = departments.reduce((sum, dept) => sum + dept.workerCount, 0);
  const totalPending = departments.reduce((sum, dept) => sum + dept.pendingTimecards, 0);

  if (departmentsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Departments Overview</h1>
        <p className="text-muted-foreground">
          Manage departments and track worker assignments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Departments</p>
                <p className="text-3xl font-bold">{departments.length}</p>
              </div>
              <Building2 className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workers</p>
                <p className="text-3xl font-bold">{totalWorkers}</p>
              </div>
              <Users className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Timecards</p>
                <p className="text-3xl font-bold text-orange-600">{totalPending}</p>
              </div>
              <Clock className="h-12 w-12 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              All Departments
            </CardTitle>
            {departments.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, departments.length)} of {departments.length}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No departments found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedDepartments.map((dept) => (
                  <div key={dept.department} className="border rounded-lg">
                    {/* Department Header */}
                    <div
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleDepartment(dept.department)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedDepartment === dept.department ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{dept.department}</h3>
                            <p className="text-sm text-muted-foreground">
                              Rate: KSh {typeof dept.hourlyRate === 'number' ? dept.hourlyRate.toFixed(2) : parseFloat(dept.hourlyRate || '0').toFixed(2)}/hour
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              <Users className="h-3 w-3 mr-1" />
                              {dept.workerCount} Workers
                            </Badge>
                          </div>

                          {dept.pendingTimecards > 0 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              {dept.pendingTimecards} Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Workers Table */}
                    {expandedDepartment === dept.department && (
                      <div className="border-t">
                        {workersLoading ? (
                          <div className="p-8">
                            <Skeleton className="h-32 w-full" />
                          </div>
                        ) : workers.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No workers assigned to this department</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Worker</TableHead>
                                  <TableHead>Position</TableHead>
                                  <TableHead>Hours/Week</TableHead>
                                  <TableHead>Total Hours</TableHead>
                                  <TableHead>Total Earnings</TableHead>
                                  <TableHead>Pending</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {workers.map((worker) => (
                                  <TableRow key={worker.userId}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{worker.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{worker.email}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>{worker.position}</TableCell>
                                    <TableCell>{worker.hoursPerWeek}h</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        {parseFloat(worker.totalHours || '0').toFixed(1)}h
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                                        KSh {parseFloat(worker.totalEarnings || '0').toLocaleString()}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {worker.pendingTimecards > 0 ? (
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                          {worker.pendingTimecards}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1));
                            setExpandedDepartment(null);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => {
                              setCurrentPage(page);
                              setExpandedDepartment(null);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => {
                            setCurrentPage(prev => Math.min(totalPages, prev + 1));
                            setExpandedDepartment(null);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
