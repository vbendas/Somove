"use client";

import { useState } from "react";
import { saveIntake, skipIntake } from "@/app/actions/intake";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const REASONS = [
  "Stress & anxiety",
  "Trauma recovery",
  "Burnout",
  "Body tension & pain",
  "Emotional regulation",
  "Self-awareness & growth",
  "Relationship challenges",
  "Curiosity about somatic work",
];

export default function IntakePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [experience, setExperience] = useState<string>("");

  const toggleReason = (reason: string) => {
    setReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const canProceed = () => {
    if (step === 1) return reasons.length > 0;
    if (step === 2) return experience !== "";
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const result = await saveIntake({
      reasons,
      previousExperience: experience,
    });

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <CardTitle className="font-heading text-2xl">
            {step === 1 && "What brings you here?"}
            {step === 2 && "Your experience"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Select all that apply. This helps us personalize your experience."}
            {step === 2 && "Have you worked with a somatic therapist before?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="flex flex-wrap gap-3">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => toggleReason(reason)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    reasons.includes(reason)
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-warm-gray hover:bg-surface/80"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {[
                { value: "yes", label: "Yes, I have worked with a somatic therapist" },
                { value: "no", label: "No, this is my first time" },
                { value: "not_sure", label: "Not sure / I'm not familiar with somatic therapy" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperience(opt.value)}
                  className={`w-full rounded-card border p-4 text-left transition-all ${
                    experience === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <Button variant="ghost" onClick={skipIntake} className="flex-1">
              Skip
            </Button>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="flex-none"
              >
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex-1"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1"
              >
                {loading ? "Saving..." : "Get Started"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
