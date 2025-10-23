import {
  Building2,
  Briefcase,
  CreditCard,
  Home,
  Users,
  Vote,
  FileText,
  Clock,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  user: {
    fullName: string;
    role: string;
    email: string;
  } | null;
  onLogout: () => void;
}

const menuItems = {
  main: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Analytics", url: "/analytics", icon: TrendingUp },
  ],
  chapa360: [
    { title: "My Account", url: "/chapa360/account", icon: CreditCard },
    { title: "Transactions", url: "/chapa360/transactions", icon: FileText },
  ],
  swsms: [
    { title: "Applications", url: "/swsms/applications", icon: Briefcase },
    { title: "Timecards", url: "/swsms/timecards", icon: Clock },
  ],
  sgms: [
    { title: "Elections", url: "/sgms/elections", icon: Vote },
    { title: "Handovers", url: "/sgms/handovers", icon: Users },
  ],
};

const adminItems = {
  chapa360: [
    { title: "All Accounts", url: "/admin/chapa360/accounts", icon: CreditCard },
  ],
  swsms: [
    { title: "Vetting Dashboard", url: "/admin/swsms/vetting", icon: Briefcase },
    { title: "All Timecards", url: "/admin/swsms/timecards", icon: Clock },
  ],
  sgms: [
    { title: "Manage Elections", url: "/admin/sgms/elections", icon: Vote },
  ],
};

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const isAdmin = user?.role === "admin" || user?.role === "supervisor" || user?.role === "treasurer";

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ueab-blue">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-sidebar-foreground">SAMS</h1>
            <p className="text-xs text-muted-foreground">UEAB Student System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-ueab-blue">Chapa360 Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isAdmin ? adminItems.chapa360 : menuItems.chapa360).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-ueab-blue">SWSMS Work Study</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isAdmin ? [...menuItems.swsms, ...adminItems.swsms] : menuItems.swsms).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-ueab-gold">SGMS Governance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isAdmin ? [...menuItems.sgms, ...adminItems.sgms] : menuItems.sgms).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-ueab-blue text-white text-xs">
                  {user.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{user.fullName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
