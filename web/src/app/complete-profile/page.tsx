"use client";

import { useState } from "react";
import { updateUserName } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout/page-container";
import { toast } from "sonner";

export default function CompleteProfilePage() {
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateUserName(name, acceptedTerms);

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  };

  return (
    <PageContainer standalone width="narrow" className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl">Complete Your Profile</CardTitle>
          <CardDescription>
            What should we call you?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="h-12"
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="accept-terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                required
                disabled={loading}
                className="mt-1"
              />
              <Label htmlFor="accept-terms" className="text-sm font-normal text-foreground">
                I accept the{" "}
                <a href="/legal/terms" target="_blank" className="underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/legal/privacy" target="_blank" className="underline">
                  Privacy Policy
                </a>
                .
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full h-12"
              disabled={loading || !name || !acceptedTerms}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}