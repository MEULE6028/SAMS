import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth, getDashboardRoute } from "@/lib/auth";
import { useEffect } from "react";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useToast } from "@/hooks/use-toast";

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import AnalyticsPage from "@/pages/analytics";
import Chapa360AccountPage from "@/pages/chapa360/account";
import TransactionsPage from "@/pages/chapa360/transactions";
import WorkApplicationsPage from "@/pages/swsms/applications";
import TimecardsPage from "@/pages/swsms/timecards";
import HandoversPage from "@/pages/sgms/handovers";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminAccountsManagementPage from "@/pages/admin/accounts";
import AdminAnalyticsPage from "@/pages/admin/analytics";
import VettingDashboard from "@/pages/admin/swsms/vetting";
import AdminTimecardsPage from "@/pages/admin/swsms/timecards";
import DepartmentRatesPage from "@/pages/admin/swsms/department-rates";
import AdminElectionsPage from "@/pages/admin/sgms/elections";
import WSupervisorDashboard from "@/pages/wsupervisor/dashboard";
import WSupervisorApplications from "@/pages/wsupervisor/applications";
import WSupervisorTimecards from "@/pages/wsupervisor/timecards";
import WSupervisorDepartments from "@/pages/wsupervisor/departments";
import SupervisorDashboard from "@/pages/supervisor/dashboard";
import SupervisorTimecards from "@/pages/supervisor/timecards";
import StudentDashboard from "@/pages/demo/student-dashboard";
import StudentElectionsPage from "@/pages/student/elections";
import AppointmentsPage from "@/pages/student/appointments";
import HostelPage from "@/pages/student/hostel";
import ResidenceRecordsPage from "@/pages/student/residence-records";
import AttendancePage from "@/pages/student/attendance";
import WorkStudyPage from "@/pages/student/work-study";
import WalletPage from "@/pages/student/wallet";
import SignOutPage from "@/pages/student/sign-out";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  return <Component />;
}

function StudentRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    } else {
      const adminRoles = ['admin', 'supervisor', 'treasurer', 'vc'];
      if (adminRoles.includes(user.role)) {
        // Redirect admin users to admin dashboard
        setLocation("/admin/dashboard");
      }
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const adminRoles = ['admin', 'supervisor', 'treasurer', 'vc'];
  if (adminRoles.includes(user.role)) {
    return null;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      const dashboardRoute = getDashboardRoute(user);
      setLocation(dashboardRoute);
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  return <Component />;
}

function Router() {
  const { user, logout } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={LoginPage} />
      </Route>
      <Route path="/register">
        <PublicRoute component={RegisterPage} />
      </Route>
      <Route path="/dashboard">
        <StudentRoute component={Dashboard} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={AnalyticsPage} />
      </Route>
      <Route path="/chapa360/account">
        <ProtectedRoute component={Chapa360AccountPage} />
      </Route>
      <Route path="/chapa360/transactions">
        <ProtectedRoute component={TransactionsPage} />
      </Route>
      <Route path="/swsms/applications">
        <ProtectedRoute component={WorkApplicationsPage} />
      </Route>
      <Route path="/swsms/timecards">
        <ProtectedRoute component={TimecardsPage} />
      </Route>
      <Route path="/elections">
        <ProtectedRoute component={StudentElectionsPage} />
      </Route>
      <Route path="/appointments">
        <ProtectedRoute component={AppointmentsPage} />
      </Route>
      <Route path="/hostel">
        <ProtectedRoute component={HostelPage} />
      </Route>
      <Route path="/residence-records">
        <ProtectedRoute component={ResidenceRecordsPage} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={AttendancePage} />
      </Route>
      <Route path="/work-study">
        <ProtectedRoute component={WorkStudyPage} />
      </Route>
      <Route path="/wallet">
        <ProtectedRoute component={WalletPage} />
      </Route>
      <Route path="/sign-out">
        <ProtectedRoute component={SignOutPage} />
      </Route>
      <Route path="/sgms/handovers">
        <ProtectedRoute component={HandoversPage} />
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/accounts">
        <ProtectedRoute component={AdminAccountsManagementPage} />
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute component={AdminAnalyticsPage} />
      </Route>
      <Route path="/admin/swsms/vetting">
        <ProtectedRoute component={VettingDashboard} />
      </Route>
      <Route path="/admin/swsms/timecards">
        <ProtectedRoute component={AdminTimecardsPage} />
      </Route>
      <Route path="/admin/swsms/department-rates">
        <ProtectedRoute component={DepartmentRatesPage} />
      </Route>
      <Route path="/admin/sgms/elections">
        <ProtectedRoute component={AdminElectionsPage} />
      </Route>

      {/* wSupervisor Routes */}
      <Route path="/wsupervisor">
        <ProtectedRoute component={WSupervisorDashboard} />
      </Route>
      <Route path="/wsupervisor/dashboard">
        <ProtectedRoute component={WSupervisorDashboard} />
      </Route>
      <Route path="/wsupervisor/applications">
        <ProtectedRoute component={WSupervisorApplications} />
      </Route>
      <Route path="/wsupervisor/timecards">
        <ProtectedRoute component={WSupervisorTimecards} />
      </Route>
      <Route path="/wsupervisor/departments">
        <ProtectedRoute component={WSupervisorDepartments} />
      </Route>

      {/* Department Supervisor Routes */}
      <Route path="/supervisor">
        <ProtectedRoute component={SupervisorDashboard} />
      </Route>
      <Route path="/supervisor/dashboard">
        <ProtectedRoute component={SupervisorDashboard} />
      </Route>
      <Route path="/supervisor/timecards">
        <ProtectedRoute component={SupervisorTimecards} />
      </Route>

      <Route path="/">
        {user ? <Redirect to={getDashboardRoute(user)} /> : <Redirect to="/login" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  // Enable automatic token refresh for authenticated users
  useTokenRefresh();

  // Listen for token expiration events
  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      toast({
        title: "Session Expired",
        description: event.detail.message || "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    };

    window.addEventListener("token-expired", handleTokenExpired as EventListener);

    return () => {
      window.removeEventListener("token-expired", handleTokenExpired as EventListener);
    };
  }, [toast]);

  const isPublicRoute = location === "/login" || location === "/register";

  if (isPublicRoute) {
    return <Router />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} onLogout={logout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border bg-card">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8 lg:p-12 bg-background">
            <div className="max-w-7xl mx-auto">
              <Router />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppLayout />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
