"use client";

import { useState } from "react";
import { signInWithMagicLink } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signInWithMagicLink(email);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      setSent(true);
      toast.success("Magic link sent! Check your email.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl">Welcome to Somove</CardTitle>
          <CardDescription>
            {sent
              ? "Check your email for the magic link"
              : "Enter your email to sign in or create an account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-warm-gray">
                We sent a magic link to <strong>{email}</strong>. Click the link in the email to sign in.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="w-full"
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading || !email}>
                {loading ? "Sending..." : "Send Magic Link"}
              </Button>
              <p className="text-xs text-center text-warm-gray">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
