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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
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
    <PageContainer width="full">
      <PageHeader title="Invites" description="Manage professional invitations." />

      <div className="space-y-6">
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
              aria-label="Invitee email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="professional@example.com"
              required
              className="h-12 flex-1"
            />
            <select
              aria-label="Invitee role"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites
                  .filter((i) => !i.accepted_at)
                  .map((invite) => {
                    const isExpired = new Date(invite.expires_at) < new Date();
                    return (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">
                          {invite.role}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {isExpired
                            ? "Expired"
                            : new Date(invite.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {invites.filter((i) => i.accepted_at).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Accepted Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Accepted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites
                  .filter((i) => i.accepted_at)
                  .map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {invite.role}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invite.accepted_at!).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      </div>
    </PageContainer>
  );
}
