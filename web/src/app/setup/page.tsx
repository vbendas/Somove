"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { completeSetup } from "@/app/actions/setup";

const STEPS = ["welcome", "branding", "admin", "smtp", "stripe", "launch"];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [platformName, setPlatformName] = useState("Somove");
  const [platformTagline, setPlatformTagline] = useState("Professional Session Platform");
  const [primaryColor, setPrimaryColor] = useState("#D4A574");
  const [accentColor, setAccentColor] = useState("#8BA888");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [openRegistration, setOpenRegistration] = useState(true);

  const handleComplete = async () => {
    setLoading(true);

    const result = await completeSetup({
      platformName,
      platformTagline,
      primaryColor,
      accentColor,
      adminEmail,
      adminName,
      adminPassword,
      openRegistration,
      bootstrapToken: "",
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Setup complete! Welcome to Somove.");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <CardTitle className="font-heading text-3xl">
            {step === 0 && "Welcome to Somove"}
            {step === 1 && "Brand Your Platform"}
            {step === 2 && "Create Admin Account"}
            {step === 3 && "Email Settings"}
            {step === 4 && "Connect Payments"}
            {step === 5 && "Launch!"}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Let's get your session platform set up in a few steps."}
            {step === 1 && "Customize the look and feel of your platform."}
            {step === 2 && "Create the administrator account."}
            {step === 3 && "Configure email notifications (optional)."}
            {step === 4 && "Set up Stripe to receive payments from clients."}
            {step === 5 && "You're all set to start using Somove."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                This wizard will guide you through setting up your self-hosted
                session platform. It takes about 2 minutes.
              </p>
              <Button onClick={() => setStep(1)} className="w-full h-12">
                Get Started
              </Button>
            </div>
          )}

          {/* Step 1: Branding */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform Name</label>
                <Input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="Your Platform Name"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tagline</label>
                <Input
                  value={platformTagline}
                  onChange={(e) => setPlatformTagline(e.target.value)}
                  placeholder="Professional Session Platform"
                  className="h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 w-12 cursor-pointer rounded border-0"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-12 w-12 cursor-pointer rounded border-0"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-12 font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1 h-12">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Email</label>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <Input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Your name"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className="h-12"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="openRegistration"
                  checked={openRegistration}
                  onChange={(e) => setOpenRegistration(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="openRegistration" className="text-sm">
                  Allow open client registration
                </label>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 h-12">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: SMTP (Optional) */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Email settings are optional. You can configure them later in the
                admin dashboard.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1 h-12">
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Stripe Connect */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Stripe account to receive payments from clients.
                You&apos;ll be redirected to Stripe to complete setup.
              </p>
              <a
                href="/api/stripe/connect"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-md bg-[#635BFF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#635BFF]/90 transition-colors"
              >
                Connect Stripe Account
              </a>
              <p className="text-xs text-muted-foreground">
                You can skip this and set up payments later in Settings.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1 h-12">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Launch */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-accent/10 p-4 text-center">
                <p className="text-sm">
                  Your platform is ready! Click below to complete setup and log
                  in as the administrator.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(4)}
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 h-12"
                >
                  {loading ? "Setting up..." : "Launch Somove"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
