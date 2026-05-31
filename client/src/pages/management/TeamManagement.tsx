import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Copy, Users, Shield, Trash2, Loader2, Check } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "management", label: "Management" },
  { value: "case_manager", label: "Case Manager" },
  { value: "tech_compliance", label: "Tech & Compliance" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "gestor", label: "Gestor" },
  { value: "translator", label: "Translator" },
  { value: "read_only_advisor", label: "Read-Only Advisor" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
] as const;

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
  management: "bg-blue-100 text-blue-800",
  case_manager: "bg-green-100 text-green-800",
  tech_compliance: "bg-orange-100 text-orange-800",
  marketing: "bg-pink-100 text-pink-800",
  finance: "bg-yellow-100 text-yellow-800",
  gestor: "bg-indigo-100 text-indigo-800",
  translator: "bg-teal-100 text-teal-800",
  read_only_advisor: "bg-slate-100 text-slate-800",
  user: "bg-gray-100 text-gray-800",
};

function MultiRoleSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (roles: string[]) => void;
}) {
  const toggle = (role: string) => {
    if (selected.includes(role)) {
      if (selected.length === 1) return; // Must have at least one
      onChange(selected.filter((r) => r !== role));
    } else {
      onChange([...selected, role]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {ROLE_OPTIONS.map((r) => {
        const isSelected = selected.includes(r.value);
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => toggle(r.value)}
            className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
              isSelected
                ? `${ROLE_COLORS[r.value]} border-current`
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

export default function TeamManagement() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoles, setInviteRoles] = useState<string[]>(["case_manager"]);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const { data: team, isLoading: teamLoading } = trpc.teamAuth.listTeam.useQuery();
  const { data: invites, isLoading: invitesLoading } = trpc.teamAuth.listInvites.useQuery();

  const createInviteMutation = trpc.teamAuth.createInvite.useMutation({
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}/join/${data.code}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite created and link copied to clipboard!");
      setInviteEmail("");
      setInviteRoles(["case_manager"]);
      utils.teamAuth.listInvites.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const revokeInviteMutation = trpc.teamAuth.revokeInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite revoked");
      utils.teamAuth.listInvites.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateRolesMutation = trpc.teamAuth.updateRoles.useMutation({
    onSuccess: () => {
      toast.success("Roles updated");
      setEditingMemberId(null);
      utils.teamAuth.listTeam.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMemberMutation = trpc.teamAuth.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      utils.teamAuth.listTeam.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteRoles.length === 0) {
      toast.error("Select at least one role");
      return;
    }
    createInviteMutation.mutate({
      email: inviteEmail || undefined,
      roles: inviteRoles as any,
      expiresInDays,
    });
  };

  const copyInviteLink = (code: string) => {
    const url = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  };

  const startEditingRoles = (memberId: number, currentRoles: string[]) => {
    setEditingMemberId(memberId);
    setEditingRoles(currentRoles);
  };

  const saveRoles = (userId: number) => {
    updateRolesMutation.mutate({ userId, roles: editingRoles as any });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
        <p className="text-slate-500 mt-1">Invite team members, manage roles, and control access</p>
      </div>

      {/* Create Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-amber-500" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label htmlFor="inviteEmail">Email (optional — locks invite to this address)</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="team@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1 w-[120px]">
                <Label>Expires in</Label>
                <Select value={String(expiresInDays)} onValueChange={(v) => setExpiresInDays(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Roles (select one or more)</Label>
              <MultiRoleSelector selected={inviteRoles} onChange={setInviteRoles} />
            </div>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={createInviteMutation.isPending}
            >
              {createInviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Invites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-blue-500" />
            Pending Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : !invites || invites.filter((i: any) => i.status === "active").length === 0 ? (
            <p className="text-slate-500 text-sm py-2">No pending invites</p>
          ) : (
            <div className="space-y-2">
              {invites.filter((i: any) => i.status === "active").map((invite: any) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[invite.role] || "bg-gray-100"}`}>
                      {invite.role}
                    </span>
                    <span className="text-sm text-slate-700">{invite.email || "Any email"}</span>
                    <span className="text-xs text-slate-400">
                      Expires {formatDate(invite.expiresAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => copyInviteLink(invite.code)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => revokeInviteMutation.mutate({ id: invite.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-green-500" />
            Team Members ({team?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : !team || team.length === 0 ? (
            <p className="text-slate-500 text-sm py-2">No team members yet</p>
          ) : (
            <div className="space-y-3">
              {team.map((member: any) => (
                <div key={member.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                        {(member.name || member.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{member.name || "Unnamed"}</p>
                        <p className="text-xs text-slate-500">{member.email || "No email"}</p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {member.loginMethod === "email" ? "Email login" : "OAuth"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingMemberId === member.id ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs"
                            onClick={() => saveRoles(member.id)}
                            disabled={updateRolesMutation.isPending}
                          >
                            {updateRolesMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setEditingMemberId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => startEditingRoles(member.id, member.roles || [member.role])}
                        >
                          Edit Roles
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Remove ${member.name || member.email}? They will lose access.`)) {
                            removeMemberMutation.mutate({ userId: member.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Role badges */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {editingMemberId === member.id ? (
                      <MultiRoleSelector selected={editingRoles} onChange={setEditingRoles} />
                    ) : (
                      (member.roles || [member.role]).map((role: string) => (
                        <span
                          key={role}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role] || "bg-gray-100"}`}
                        >
                          {ROLE_OPTIONS.find((r) => r.value === role)?.label || role}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
