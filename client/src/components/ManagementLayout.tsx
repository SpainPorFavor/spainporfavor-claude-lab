/**
 * ManagementLayout — Sidebar layout for the /management Command Center.
 * Role-gated: only internal team members can access.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  CalendarCheck,
  Columns3,
  ShieldAlert,
  Lock,
  CheckCircle,
  Users,
  Rocket,
  ScrollText,
  BookOpen,
  LogOut,
  Menu,
  X,
  Contact,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";

const MANAGEMENT_ROLES = [
  "admin",
  "super_admin",
  "management",
  "case_manager",
  "tech_compliance",
  "marketing",
  "finance",
];

const VENDOR_ROLES = ["gestor", "translator"];

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // If empty, all management roles can see
}

const navItems: NavItem[] = [
  {
    label: "Command Center",
    href: "/management",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "My Day",
    href: "/management/my-day",
    icon: <CalendarCheck className="w-4 h-4" />,
  },
  {
    label: "Task Board",
    href: "/management/tasks",
    icon: <Columns3 className="w-4 h-4" />,
  },
  {
    label: "Case Rescue",
    href: "/management/case-rescue",
    icon: <ShieldAlert className="w-4 h-4" />,
    roles: ["admin", "super_admin", "management", "case_manager"],
  },
  {
    label: "Security & Compliance",
    href: "/management/security",
    icon: <Lock className="w-4 h-4" />,
    roles: ["admin", "super_admin", "tech_compliance"],
  },
  {
    label: "Approvals",
    href: "/management/approvals",
    icon: <CheckCircle className="w-4 h-4" />,
    roles: ["admin", "super_admin", "management"],
  },
  {
    label: "Vendor Queue",
    href: "/management/vendors",
    icon: <Users className="w-4 h-4" />,
  },
  {
    label: "Launch Checklist",
    href: "/management/launch",
    icon: <Rocket className="w-4 h-4" />,
  },
  {
    label: "Audit Log",
    href: "/management/audit",
    icon: <ScrollText className="w-4 h-4" />,
    roles: ["admin", "super_admin", "tech_compliance"],
  },
  {
    label: "Team",
    href: "/management/team",
    icon: <Users className="w-4 h-4" />,
    roles: ["admin", "super_admin", "management"],
  },
  {
    label: "Leads",
    href: "/management/leads",
    icon: <Contact className="w-4 h-4" />,
  },
  {
    label: "Resources",
    href: "/management/resources",
    icon: <BookOpen className="w-4 h-4" />,
  },
];

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Fetch multi-roles only when user is available
  const { data: myRolesData, isLoading: rolesLoading } = trpc.teamAuth.getMyRoles.useQuery(
    undefined,
    { enabled: !!user, retry: 1 }
  );

  // Redirect to login if not authenticated (inside useEffect to avoid render-phase side effects)
  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true);
      window.location.href = getLoginUrl();
    }
  }, [loading, user, redirecting]);

  // Show loading while auth or roles are being fetched
  if (loading || rolesLoading || redirecting || (!user && !loading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Determine all roles for this user
  const allUserRoles = myRolesData?.roles || [user.role];
  const canAccess = allUserRoles.some(
    (r: string) => MANAGEMENT_ROLES.includes(r) || VENDOR_ROLES.includes(r)
  );

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Access Denied
          </h1>
          <p className="text-slate-500">
            You don't have permission to access the Command Center.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Your roles: {allUserRoles.join(", ")}
          </p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  // Filter nav items by role
  const visibleNav = navItems.filter((item) => {
    if (!item.roles) return true;
    return allUserRoles.some((r: string) => item.roles!.includes(r));
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-white fixed inset-y-0 left-0 z-30">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase">
            SPF Command Center
          </h2>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {visibleNav.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/management" &&
                location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name || "Team Member"}
              </p>
              <p className="text-xs text-slate-400 truncate">{allUserRoles.join(", ")}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase">
          SPF Command Center
        </h2>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-12 left-0 w-64 bg-slate-900 h-full overflow-y-auto py-4 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1">
              {visibleNav.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-12 lg:pt-0 overflow-x-hidden">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
