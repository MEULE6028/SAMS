import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import AnalyticsPage from "@/pages/analytics";
import Chapa360AccountPage from "@/pages/chapa360/account";
import TransactionsPage from "@/pages/chapa360/transactions";
import WorkApplicationsPage from "@/pages/swsms/applications";
import TimecardsPage from "@/pages/swsms/timecards";
import ElectionsPage from "@/pages/sgms/elections";
import HandoversPage from "@/pages/sgms/handovers";
import VettingDashboard from "@/pages/admin/swsms/vetting";
import AdminAccountsPage from "@/pages/admin/chapa360/accounts";
import AdminTimecardsPage from "@/pages/admin/swsms/timecards";
import AdminElectionsPage from "@/pages/admin/sgms/elections";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/dashboard");
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
        <ProtectedRoute component={Dashboard} />
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
      <Route path="/sgms/elections">
        <ProtectedRoute component={ElectionsPage} />
      </Route>
      <Route path="/sgms/handovers">
        <ProtectedRoute component={HandoversPage} />
      </Route>
      <Route path="/admin/chapa360/accounts">
        <ProtectedRoute component={AdminAccountsPage} />
      </Route>
      <Route path="/admin/swsms/vetting">
        <ProtectedRoute component={VettingDashboard} />
      </Route>
      <Route path="/admin/swsms/timecards">
        <ProtectedRoute component={AdminTimecardsPage} />
      </Route>
      <Route path="/admin/sgms/elections">
        <ProtectedRoute component={AdminElectionsPage} />
      </Route>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

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
