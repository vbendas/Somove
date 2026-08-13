"use client";

import { useState } from "react";
import { exportMyData, deleteMyAccount } from "@/app/actions/privacy";
import { PageContainer } from "@/components/layout/page-container";
import { toast } from "sonner";

export default function PrivacySettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportMyData();
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "somove-export.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Your data has been exported.");
      }
    } catch {
      toast.error("Failed to export data.");
    }
    setExporting(false);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const result = await deleteMyAccount();
      if (result.error) {
        toast.error(result.error);
        setDeleting(false);
      }
    } catch {
      toast.error("Failed to delete account.");
      setDeleting(false);
    }
  }

  return (
    <PageContainer standalone width="narrow">
      <h1 className="mb-8 font-heading text-2xl text-foreground">Privacy & Data</h1>

      <section className="mb-8 rounded-xl border border-border p-6">
        <h2 className="mb-2 font-heading text-lg text-foreground">Export Your Data</h2>
        <p className="mb-4 text-sm text-warm-gray">
          Download a copy of all your personal data stored on this platform,
          including your profile, sessions, messages, notes, and payments.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export my data"}
        </button>
      </section>

      <section className="rounded-xl border border-destructive/40 p-6">
        <h2 className="mb-2 font-heading text-lg text-destructive">Delete Account</h2>
        <p className="mb-4 text-sm text-warm-gray">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {deleting
            ? "Deleting..."
            : confirmDelete
            ? "Click again to confirm — this is irreversible"
            : "Delete my account"}
        </button>
        {confirmDelete && !deleting && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="ml-2 text-sm text-warm-gray underline"
          >
            Cancel
          </button>
        )}
      </section>

      <p className="mt-8 text-xs text-warm-gray">
        See our{" "}
        <a href="/legal/privacy" className="underline">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="/legal/terms" className="underline">
          Terms of Service
        </a>
        .
      </p>
    </PageContainer>
  );
}