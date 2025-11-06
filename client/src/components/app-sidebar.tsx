import {
  Building2,
  Briefcase,
  CreditCard,
  DollarSign,
  Home,
  Users,
  Vote,
  FileText,
  Clock,
  TrendingUp,
  LogOut,
  BedDouble,
  Activity,
  Wallet,
  MapPin,
  Settings,
  FileCheck,
  UserPlus,
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
  student: [
    { title: "My Dashboard", url: "/dashboard", icon: Home },
    { title: "Hostel & Residence", url: "/hostel", icon: BedDouble },
    { title: "Attendance Records", url: "/attendance", icon: Activity },
    { title: "Work Study", url: "/work-study", icon: Briefcase },
    { title: "Elections", url: "/elections", icon: Vote },
    { title: "My Wallet", url: "/wallet", icon: Wallet },
    { title: "Sign-Out Requests", url: "/sign-out", icon: MapPin },
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
    { title: "Handovers", url: "/sgms/handovers", icon: Users },
  ],
};

const adminItems = {
  overview: [
    { title: "Dashboard", url: "/admin/dashboard", icon: Home },
    { title: "Accounts Management", url: "/admin/accounts", icon: Users },
    { title: "Analytics & Reports", url: "/admin/analytics", icon: TrendingUp },
  ],
  swsms: [
    { title: "Vetting Dashboard", url: "/admin/swsms/vetting", icon: Briefcase },
    { title: "All Timecards", url: "/admin/swsms/timecards", icon: Clock },
    { title: "Department Rates", url: "/admin/swsms/department-rates", icon: DollarSign },
  ],
  sgms: [
    { title: "Manage Elections", url: "/admin/sgms/elections", icon: Vote },
  ],
};

const wSupervisorItems = [
  { title: "Dashboard", url: "/wsupervisor/dashboard", icon: Home },
  { title: "Applications", url: "/wsupervisor/applications", icon: FileText },
  { title: "Timecards", url: "/wsupervisor/timecards", icon: Clock },
  { title: "Departments", url: "/wsupervisor/departments", icon: Building2 },
  { title: "Department Rates", url: "/admin/swsms/department-rates", icon: DollarSign },
];

const supervisorItems = [
  { title: "Dashboard", url: "/supervisor/dashboard", icon: Home },
  { title: "Timecards", url: "/supervisor/timecards", icon: Clock },
];

const deanItems = [
  { title: "Dashboard", url: "/dean/dashboard", icon: Home },
  { title: "Hostels", url: "/dean/hostels", icon: Building2 },
  { title: "Bookings", url: "/dean/bookings", icon: FileCheck },
  { title: "Allocate Room", url: "/dean/allocate", icon: UserPlus },
  { title: "Rooms", url: "/dean/rooms", icon: BedDouble },
  { title: "Students", url: "/dean/students", icon: Users },
];

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();

  const isAdmin = user?.role === "admin" || user?.role === "treasurer";
  const isSupervisor = user?.role === "supervisor";
  const isWSupervisor = user?.role === "wSupervisor";
  const isDean = user?.role === "deanLadies" || user?.role === "deanMen";
  const isStudent = user?.role === "student";

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
        {isStudent ? (
          <SidebarGroup>
            <SidebarGroupLabel>Student Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.student.map((item) => (
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
        ) : (
          <>
            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Admin Overview</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.overview.map((item) => (
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
            )}

            {isWSupervisor && (
              <SidebarGroup>
                <SidebarGroupLabel>Work Study Oversight</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {wSupervisorItems.map((item) => (
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
            )}

            {isSupervisor && (
              <SidebarGroup>
                <SidebarGroupLabel>Department Supervision</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {supervisorItems.map((item) => (
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
            )}

            {isDean && (
              <SidebarGroup>
                <SidebarGroupLabel>Residence Management</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {deanItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {!isAdmin && !isWSupervisor && !isSupervisor && !isDean && (
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
            )}

            {!isAdmin && !isWSupervisor && !isSupervisor && !isDean && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-ueab-blue">Chapa360 Finance</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.chapa360.map((item) => (
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
            )}

            {!isWSupervisor && !isSupervisor && !isDean && (
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
            )}

            {!isWSupervisor && !isSupervisor && !isDean && (
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
            )}
          </>
        )}
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
