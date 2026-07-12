"use client";

import { useState, useEffect, useRef } from "react";
import { getPlatformSettings, updatePlatformSettings, updatePlatformTheme } from "@/app/actions/setup";
import { uploadPageImage } from "@/app/actions/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";

// These mirror the platform's default branding values (see
// DEFAULT_SETTINGS in `src/lib/platform.ts`). They are functional data
// defaults for the color-picker form below, not decorative styling, so
// they intentionally stay as literal hex values rather than token classes.
const DEFAULT_PRIMARY_COLOR = "#D4A574";
const DEFAULT_ACCENT_COLOR = "#8BA888";
const DEFAULT_BACKGROUND_COLOR = "#FFFDF5";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [platformName, setPlatformName] = useState("Somove");
  const [platformTagline, setPlatformTagline] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [openRegistration, setOpenRegistration] = useState(true);
  const [platformFeePercent, setPlatformFeePercent] = useState(10);
  const [defaultVideoProvider, setDefaultVideoProvider] = useState("daily");

  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    setPrimaryColor(settings.primary_color);
    setAccentColor(settings.accent_color);
    setBackgroundColor(settings.background_color);
    setLogoUrl(settings.logo_url);
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

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadPageImage(formData);
      if (result.error || !result.url) {
        toast.error(result.error ?? "Failed to upload logo");
        return;
      }
      setLogoUrl(result.url);
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleResetTheme() {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setAccentColor(DEFAULT_ACCENT_COLOR);
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setLogoUrl(null);
  }

  async function handleSaveTheme() {
    if (
      !HEX_COLOR_REGEX.test(primaryColor) ||
      !HEX_COLOR_REGEX.test(accentColor) ||
      !HEX_COLOR_REGEX.test(backgroundColor)
    ) {
      toast.error("Invalid color format");
      return;
    }

    setSavingTheme(true);
    const result = await updatePlatformTheme({
      primary_color: primaryColor,
      accent_color: accentColor,
      background_color: backgroundColor,
      logo_url: logoUrl,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Branding saved!");
    }
    setSavingTheme(false);
  }

  if (loading) {
    return (
      <PageContainer width="full">
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="full">
      <PageHeader title="Platform Settings" description="Configure your platform settings." />

      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="platformName" className="text-sm font-medium">Platform Name</label>
            <Input
              id="platformName"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="platformTagline" className="text-sm font-medium">Tagline</label>
            <Input
              id="platformTagline"
              value={platformTagline}
              onChange={(e) => setPlatformTagline(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="supportEmail" className="text-sm font-medium">Support Email</label>
            <Input
              id="supportEmail"
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
              className="h-4 w-4 rounded border-input"
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
            <label htmlFor="platformFeePercent" className="text-sm font-medium">Platform Fee (%)</label>
            <Input
              id="platformFeePercent"
              type="number"
              value={platformFeePercent}
              onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
              min={0}
              max={50}
              className="h-12 w-32"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="defaultVideoProvider" className="text-sm font-medium">Default Video Provider</label>
            <select
              id="defaultVideoProvider"
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

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Colors and logo shown across the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="primaryColorPicker" className="text-sm font-medium">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                id="primaryColorPicker"
                type="color"
                aria-label="Primary color picker"
                value={HEX_COLOR_REGEX.test(primaryColor) ? primaryColor : DEFAULT_PRIMARY_COLOR}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded border border-input p-1"
              />
              <Input
                id="primaryColorHex"
                aria-label="Primary color hex value"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-12 w-40"
                placeholder={DEFAULT_PRIMARY_COLOR}
              />
              <span
                className="h-8 w-8 rounded-full border border-input"
                style={{ backgroundColor: HEX_COLOR_REGEX.test(primaryColor) ? primaryColor : undefined }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="accentColorPicker" className="text-sm font-medium">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                id="accentColorPicker"
                type="color"
                aria-label="Accent color picker"
                value={HEX_COLOR_REGEX.test(accentColor) ? accentColor : DEFAULT_ACCENT_COLOR}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-14 rounded border border-input p-1"
              />
              <Input
                id="accentColorHex"
                aria-label="Accent color hex value"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-12 w-40"
                placeholder={DEFAULT_ACCENT_COLOR}
              />
              <span
                className="h-8 w-8 rounded-full border border-input"
                style={{ backgroundColor: HEX_COLOR_REGEX.test(accentColor) ? accentColor : undefined }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="backgroundColorPicker" className="text-sm font-medium">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                id="backgroundColorPicker"
                type="color"
                aria-label="Background color picker"
                value={HEX_COLOR_REGEX.test(backgroundColor) ? backgroundColor : DEFAULT_BACKGROUND_COLOR}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-14 rounded border border-input p-1"
              />
              <Input
                id="backgroundColorHex"
                aria-label="Background color hex value"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-12 w-40"
                placeholder={DEFAULT_BACKGROUND_COLOR}
              />
              <span
                className="h-8 w-8 rounded-full border border-input"
                style={{ backgroundColor: HEX_COLOR_REGEX.test(backgroundColor) ? backgroundColor : undefined }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Logo</label>
            <div className="space-y-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-configured, arbitrary logo URL
                <img src={logoUrl} alt="Platform logo" className="max-h-16 rounded-card object-contain" />
              ) : (
                <p className="text-sm text-muted-foreground">No logo set.</p>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={handleLogoFileChange}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploadingLogo ? "Uploading..." : "Upload logo"}
                </Button>
                {logoUrl ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setLogoUrl(null)}>
                    Remove logo
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleResetTheme} className="h-12 px-8">
              Reset to defaults
            </Button>
            <Button onClick={handleSaveTheme} disabled={savingTheme} className="h-12 px-8">
              {savingTheme ? "Saving..." : "Save Branding"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="h-12 px-8">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
      </div>
    </PageContainer>
  );
}
