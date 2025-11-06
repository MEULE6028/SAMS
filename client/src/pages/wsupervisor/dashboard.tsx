import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// Chart colors
const COLORS = {
  pending: "#EAB308", // yellow-600
  supervisor_review: "#3B82F6", // blue-600
  approved: "#16A34A", // green-600
  verified: "#16A34A", // green-600
  rejected: "#DC2626", // red-600
  auto_rejected: "#EF4444", // red-500
};

interface DashboardStats {
  applications: { status: string; count: number }[];
  timecards: { status: string; count: number }[];
  totalHours: string;
  totalEarnings: string;
  activeWorkers: number;
  departments: { department: string; count: number }[];
}

export default function WSupervisorDashboard() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/wsupervisor/dashboard/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/wsupervisor/dashboard/stats");
      return response;
    }
  });

  const stats = data;

  // Helper functions
  const getApplicationCount = (status: string) => {
    return stats?.applications.find((a: any) => a.status === status)?.count || 0;
  };

  const getTimecardCount = (status: string) => {
    return stats?.timecards.find((t: any) => t.status === status)?.count || 0;
  };

  const totalApplications = stats?.applications.reduce((sum: number, a: any) => sum + a.count, 0) || 0;
  const totalTimecards = stats?.timecards.reduce((sum: number, t: any) => sum + t.count, 0) || 0;
  const pendingTimecards = getTimecardCount('pending');
  const pendingApplications = getApplicationCount('pending') + getApplicationCount('supervisor_review');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Work Study Supervisor Dashboard</h1>
        <p className="text-muted-foreground">
          Oversee and manage the entire work study program
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Workers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeWorkers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Approved work study students
            </p>
          </CardContent>
        </Card>

        {/* Total Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(stats?.totalHours || '0').toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Verified hours worked
            </p>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {parseFloat(stats?.totalEarnings || '0').toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total paid to workers
            </p>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingTimecards + pendingApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingTimecards} timecards, {pendingApplications} applications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Applications & Timecards Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Applications Overview
            </CardTitle>
            <CardDescription>
              Total: {totalApplications} applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.applications && stats.applications.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.applications.map(item => ({
                      name: item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      value: item.count,
                      status: item.status
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.applications.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No applications yet</p>
              </div>
            )}

            <Link href="/wsupervisor/applications">
              <Button className="w-full mt-4" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Manage Applications
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Timecards Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timecards Overview
            </CardTitle>
            <CardDescription>
              Total: {totalTimecards} timecards submitted
              {totalTimecards > 0 && (
                <span className="ml-2">
                  • Approval Rate: {((getTimecardCount('verified') / totalTimecards) * 100).toFixed(1)}%
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.timecards && stats.timecards.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.timecards.map(item => ({
                      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                      value: item.count,
                      status: item.status
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.timecards.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No timecards submitted yet</p>
              </div>
            )}

            <Link href="/wsupervisor/timecards">
              <Button className="w-full mt-4" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Manage Timecards
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Distribution
          </CardTitle>
          <CardDescription>
            Workers assigned across departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.departments && stats.departments.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={stats.departments
                  .sort((a: any, b: any) => b.count - a.count)
                  .slice(0, 10)
                  .map(dept => ({
                    department: dept.department.length > 20
                      ? dept.department.substring(0, 20) + '...'
                      : dept.department,
                    workers: dept.count,
                    fullName: dept.department
                  }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={90} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                          <p className="text-sm font-semibold">{payload[0].payload.fullName}</p>
                          <p className="text-sm text-blue-600">Workers: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="workers" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active workers in departments yet</p>
            </div>
          )}

          <Link href="/wsupervisor/departments">
            <Button className="w-full mt-6" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View All Departments
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common supervisor tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/wsupervisor/applications?status=pending">
              <Button className="w-full" variant="outline">
                <AlertCircle className="h-4 w-4 mr-2" />
                Review Applications
              </Button>
            </Link>

            <Link href="/wsupervisor/timecards?status=pending">
              <Button className="w-full" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Verify Timecards
              </Button>
            </Link>

            <Link href="/admin/swsms/department-rates">
              <Button className="w-full" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Manage Rates
              </Button>
            </Link>

            <Link href="/wsupervisor/departments">
              <Button className="w-full" variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Department Overview
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
