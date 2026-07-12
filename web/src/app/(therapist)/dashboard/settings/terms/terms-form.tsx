"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface TermsInitial {
  tosText: string;
  tosVersion: number;
}

export function TermsForm({ initial }: { initial: TermsInitial }) {
  const [loading, setLoading] = useState(false);
  const [tosText, setTosText] = useState(initial.tosText);
  const [tosVersion, setTosVersion] = useState(initial.tosVersion);

  const saveTosHandler = async () => {
    setLoading(true);
    try {
      const { saveTermsOfService } = await import("@/app/actions/session-types");
      const result = await saveTermsOfService(tosText);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      setTosVersion((v) => v + 1);
      toast.success("Terms of Service saved");
    } catch {
      toast.error("Failed to save Terms of Service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms of Service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-warm-gray">
          Write your own Terms of Service that clients will see and accept before booking a session. If left empty, Somove&apos;s default terms apply.
        </p>
        <div className="rounded-card bg-surface p-3">
          <p className="text-xs text-warm-gray">
            Current version: <span className="font-medium text-foreground">v{tosVersion}</span>
          </p>
        </div>
        <div>
          <label htmlFor="tosText" className="mb-1 block text-sm font-medium text-foreground">
            Terms of Service
          </label>
          <Textarea
            id="tosText"
            value={tosText}
            onChange={(e) => setTosText(e.target.value)}
            className="min-h-[200px]"
            placeholder="Enter your terms of service here. Clients will be required to read and accept these terms before booking a session with you."
          />
        </div>
        <Button onClick={saveTosHandler} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Terms of Service"}
        </Button>
      </CardContent>
    </Card>
  );
}
