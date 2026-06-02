"use client";

import { useState } from "react";
import { getInvites, createInvite, deleteInvite, resendInvite } from "@/app/actions/invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect } from "react";

interface Invite {
  id: string;
  email: string;
  token: string;
  role: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"therapist" | "admin">("therapist");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    const result = await getInvites();
    setInvites(result.invites);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const result = await createInvite(email, role);

    if (result.error) {
      toast.error(result.error);
      setCreating(false);
      return;
    }

    toast.success(result.message || "Invite created!");
    setEmail("");
    setCreating(false);
    loadInvites();
  }

  async function handleDelete(id: string) {
    const result = await deleteInvite(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Invite deleted.");
      loadInvites();
    }
  }

  async function handleResend(id: string) {
    const result = await resendInvite(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Invite link extended. Share: " + result.inviteUrl);
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Invites</h1>
        <p className="text-muted-foreground">
          Manage professional invitations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Invite</CardTitle>
          <CardDescription>
            Invite a new professional to join your platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="professional@example.com"
              required
              className="h-12 flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "therapist" | "admin")}
              className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="therapist">Professional</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" disabled={creating} className="h-12">
              {creating ? "Sending..." : "Send Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invites</CardTitle>
          <CardDescription>
            Invites that haven&apos;t been accepted yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : invites.filter((i) => !i.accepted_at).length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invites.</p>
          ) : (
            <div className="space-y-3">
              {invites
                .filter((i) => !i.accepted_at)
                .map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date();
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {invite.role} • Expires{" "}
                          {isExpired
                            ? "Expired"
                            : new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(invite.token)}
                        >
                          Copy Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResend(invite.id)}
                        >
                          Extend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invite.id)}
                          className="text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {invites.filter((i) => i.accepted_at).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Accepted Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invites
                .filter((i) => i.accepted_at)
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {invite.role} • Accepted{" "}
                        {new Date(invite.accepted_at!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
