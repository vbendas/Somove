"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

const CATEGORIES = [
  { value: "booking", label: "Booking" },
  { value: "session", label: "Session" },
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function SupportPage() {
  const [category, setCategory] = useState("booking");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { createSupportTicket } = await import("@/app/actions/support");
      const result = await createSupportTicket({
        category,
        subject,
        description,
        priority,
      });

      if (result.error) {
        toast.error(result.error.message);
      } else {
        setSubmitted(true);
        toast.success("Ticket submitted successfully");
      }
    } catch {
      toast.error("Failed to submit ticket");
    }
    setLoading(false);
  };

  return (
    <PageContainer width="narrow">
      <PageHeader title="Contact Support" backHref="/" />

      {submitted ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-accent" />
              <h2 className="mb-2 text-lg font-medium text-foreground">
                Ticket Submitted
              </h2>
              <p className="mb-6 text-sm text-warm-gray">
                Our team will get back to you soon. You can also use the live chat widget for immediate assistance.
              </p>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Submit a Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supportCategory" className="mb-1 block text-sm font-medium text-foreground">
                    Category
                  </label>
                  <select
                    id="supportCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="supportPriority" className="mb-1 block text-sm font-medium text-foreground">
                    Priority
                  </label>
                  <select
                    id="supportPriority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="supportSubject" className="mb-1 block text-sm font-medium text-foreground">
                  Subject
                </label>
                <Input
                  id="supportSubject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label htmlFor="supportDescription" className="mb-1 block text-sm font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  id="supportDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  className="min-h-[150px]"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !subject.trim() || !description.trim()}
                className="w-full"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  "Submit Ticket"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
    </PageContainer>
  );
}
