"use client";

import { useState, useEffect } from "react";
import { getPlatformSettings, updatePlatformSettings } from "@/app/actions/setup";
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

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [platformName, setPlatformName] = useState("Somove");
  const [platformTagline, setPlatformTagline] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [openRegistration, setOpenRegistration] = useState(true);
  const [platformFeePercent, setPlatformFeePercent] = useState(10);
  const [defaultVideoProvider, setDefaultVideoProvider] = useState("daily");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const settings = await getPlatformSettings();
    setPlatformName(settings.platform_name);
    setPlatformTagline(settings.platform_tagline || "");
    setSupportEmail(settings.support_email);
    setOpenRegistration(settings.open_registration);
    setPlatformFeePercent(settings.platform_fee_percent);
    setDefaultVideoProvider(settings.default_video_provider);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const result = await updatePlatformSettings({
      platform_name: platformName,
      platform_tagline: platformTagline,
      support_email: supportEmail,
      open_registration: openRegistration,
      platform_fee_percent: platformFeePercent,
      default_video_provider: defaultVideoProvider,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings saved!");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure your platform settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform Name</label>
            <Input
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tagline</label>
            <Input
              value={platformTagline}
              onChange={(e) => setPlatformTagline(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Support Email</label>
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business</CardTitle>
          <CardDescription>Platform fee and video provider settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform Fee (%)</label>
            <Input
              type="number"
              value={platformFeePercent}
              onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
              min={0}
              max={50}
              className="h-12 w-32"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Video Provider</label>
            <select
              value={defaultVideoProvider}
              onChange={(e) => setDefaultVideoProvider(e.target.value)}
              className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="daily">Daily.co (Free Hosted)</option>
              <option value="mirotalk">MiroTalk (Self-Hosted)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="h-12 px-8">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
