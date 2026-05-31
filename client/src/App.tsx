import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { consumeLoginReturnPath } from "@/const";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ApplicationSuccess from "./pages/ApplicationSuccess";
import FreeAssessment from "./pages/FreeAssessment";
import Portal from "./pages/Portal";
import AdminDashboard from "./pages/AdminDashboard";
import GestorDashboard from "./pages/GestorDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import GuidesHub from "./pages/GuidesHub";
import VisaGuide from "./pages/VisaGuide";
import BlogHub from "./pages/BlogHub";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import BeckhamCalculator from "./pages/BeckhamCalculator";
import Checklists from "./pages/Checklists";
import TermsOfService from "./pages/TermsOfService";
import GDPRCompliance from "./pages/GDPRCompliance";
import CookiePolicy from "./pages/CookiePolicy";
import OrderForm from "./pages/OrderForm";
import DocumentIntake from "./pages/DocumentIntake";

// Management pages
import ManagementLayout from "./components/ManagementLayout";
import CommandCenter from "./pages/management/CommandCenter";
import MyDay from "./pages/management/MyDay";
import TaskBoard from "./pages/management/TaskBoard";
import CaseRescue from "./pages/management/CaseRescue";
import SecurityCompliance from "./pages/management/SecurityCompliance";
import Approvals from "./pages/management/Approvals";
import VendorQueue from "./pages/management/VendorQueue";
import LaunchChecklist from "./pages/management/LaunchChecklist";
import AuditLog from "./pages/management/AuditLog";
import TeamManagement from "./pages/management/TeamManagement";
import Resources from "./pages/management/Resources";
import Leads from "./pages/management/Leads";
import TeamLogin from "./pages/TeamLogin";
import JoinTeam from "./pages/JoinTeam";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function ManagementPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <ManagementLayout>
      <Component />
    </ManagementLayout>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/application-success"} component={ApplicationSuccess} />
      <Route path={"/free-assessment"} component={FreeAssessment} />
      <Route path={"/portal"} component={Portal} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/gestor"} component={GestorDashboard} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/guides"} component={GuidesHub} />
      <Route path={"/guides/:slug"} component={VisaGuide} />
      <Route path={"/blog"} component={BlogHub} />
      <Route path={"/blog/:slug"} component={BlogPost} />
      <Route path={"/about"} component={About} />
      <Route path={"/tools/beckham-calculator"} component={BeckhamCalculator} />
      <Route path={"/tools/checklists"} component={Checklists} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/gdpr"} component={GDPRCompliance} />
      <Route path={"/cookies"} component={CookiePolicy} />
      <Route path={"/order"} component={OrderForm} />
      <Route path={"/documents/start"} component={DocumentIntake} />

      {/* Management Command Center */}
      <Route path="/management">
        {() => <ManagementPage component={CommandCenter} />}
      </Route>
      <Route path="/management/my-day">
        {() => <ManagementPage component={MyDay} />}
      </Route>
      <Route path="/management/tasks">
        {() => <ManagementPage component={TaskBoard} />}
      </Route>
      <Route path="/management/case-rescue">
        {() => <ManagementPage component={CaseRescue} />}
      </Route>
      <Route path="/management/security">
        {() => <ManagementPage component={SecurityCompliance} />}
      </Route>
      <Route path="/management/approvals">
        {() => <ManagementPage component={Approvals} />}
      </Route>
      <Route path="/management/vendors">
        {() => <ManagementPage component={VendorQueue} />}
      </Route>
      <Route path="/management/launch">
        {() => <ManagementPage component={LaunchChecklist} />}
      </Route>
      <Route path="/management/audit">
        {() => <ManagementPage component={AuditLog} />}
      </Route>
      <Route path="/management/team">
        {() => <ManagementPage component={TeamManagement} />}
      </Route>
      <Route path="/management/resources">
        {() => <ManagementPage component={Resources} />}
      </Route>
      <Route path="/management/leads">
        {() => <ManagementPage component={Leads} />}
      </Route>

      {/* Team Auth */}
      <Route path="/team-login" component={TeamLogin} />
      <Route path="/join/:code" component={JoinTeam} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * After OAuth login, check if there's a stored returnPath in localStorage.
 * If the user just logged in and there's a pending redirect, navigate there.
 */
function LoginReturnRedirect() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    const returnPath = consumeLoginReturnPath();
    if (returnPath && returnPath !== window.location.pathname) {
      window.location.href = returnPath;
    }
  }, [user, loading]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <LoginReturnRedirect />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
