import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { autoCapitalize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Shield, Loader2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  management: "Management",
  case_manager: "Case Manager",
  tech_compliance: "Tech & Compliance",
  marketing: "Marketing",
  finance: "Finance",
  gestor: "Gestor (Immigration Specialist)",
  translator: "Translator",
  read_only_advisor: "Read-Only Advisor",
};

export default function JoinTeam() {
  const [, navigate] = useLocation();
  const params = useParams<{ code: string }>();
  const code = params.code || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Validate invite code
  const { data: inviteInfo, isLoading: validating } = trpc.teamAuth.validateInvite.useQuery(
    { code },
    { enabled: !!code }
  );

  const registerMutation = trpc.teamAuth.register.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome to the team, ${data.user.name}!`);
      const mgmtRoles = ["super_admin", "admin", "management", "case_manager", "tech_compliance", "marketing", "finance"];
      if (mgmtRoles.includes(data.user.role)) {
        navigate("/management");
      } else if (data.user.role === "gestor" || data.user.role === "translator") {
        navigate("/management/vendors");
      } else {
        navigate("/");
      }
    },
    onError: (err) => {
      // Parse tRPC/Zod validation errors into human-readable messages
      let message = "Registration failed";
      try {
        const parsed = JSON.parse(err.message);
        if (Array.isArray(parsed) && parsed.length > 0) {
          message = parsed.map((e: any) => e.message || "Validation error").join(", ");
        } else {
          message = err.message;
        }
      } catch {
        message = err.message || "Registration failed";
      }
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    // Use the invite's locked email if set, otherwise use the user-entered email
    const emailToSubmit = inviteInfo?.email || email;
    registerMutation.mutate({ code, name, email: emailToSubmit, password });
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!inviteInfo?.valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid, expired, or has already been used. Please ask your administrator for a new invite.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate("/team-login")}>
              Go to Team Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Join SpainPorFavor</CardTitle>
          <CardDescription>
            {inviteInfo.roles && inviteInfo.roles.length > 1 ? (
              <span>You've been invited with roles: <span className="font-semibold text-amber-600">{inviteInfo.roles.map((r: string) => ROLE_LABELS[r] || r).join(", ")}</span></span>
            ) : (
              <span>You've been invited to join as <span className="font-semibold text-amber-600">{ROLE_LABELS[inviteInfo.role || ""] || inviteInfo.role}</span></span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(autoCapitalize(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={inviteInfo.email || email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!inviteInfo.email}
                required
              />
              {inviteInfo.email && (
                <p className="text-xs text-slate-500">This invite is locked to this email address</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Create Account & Join"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <a href="/team-login" className="text-amber-600 hover:underline">Sign in</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
