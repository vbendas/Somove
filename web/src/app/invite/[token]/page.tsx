"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { validateInviteToken, acceptInvite } from "@/app/actions/invites";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<{ email: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function validate() {
      const result = await validateInviteToken(token);
      if (result.valid && result.invite) {
        setInvite(result.invite);
      } else {
        setError(result.error || "Invalid invite link.");
      }
      setLoading(false);
    }
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await acceptInvite(token, name, password);

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    toast.success("Account created! You can now log in.");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Validating invite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">Invite Invalid</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full h-12">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">Accept Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join as a{" "}
            <span className="font-semibold capitalize">{invite?.role}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="inviteEmail" className="text-sm font-medium">Email</label>
              <Input
                id="inviteEmail"
                type="email"
                value={invite?.email || ""}
                disabled
                className="h-12 bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="inviteName" className="text-sm font-medium">Your Name</label>
              <Input
                id="inviteName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="invitePassword" className="text-sm font-medium">Password</label>
              <Input
                id="invitePassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                required
                minLength={8}
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !name || password.length < 8}
              className="w-full h-12"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
