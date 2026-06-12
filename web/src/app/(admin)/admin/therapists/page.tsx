"use client";

import { useState, useEffect } from "react";
import { getTherapists, updateTherapistStatus, createTherapistProfileForUser, deleteUser } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface Therapist {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  therapist_profile: {
    status: string;
    session_price_cents: number | null;
    video_provider: string;
  } | null;
}

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTherapists();
  }, []);

  async function loadTherapists() {
    const result = await getTherapists();
    setTherapists(result?.therapists ?? []);
    setLoading(false);
  }

  async function handleStatusToggle(therapistId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const result = await updateTherapistStatus(therapistId, newStatus);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Professional ${newStatus === "active" ? "activated" : "deactivated"}.`);
      loadTherapists();
    }
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name || "this user"}? This cannot be undone.`)) {
      return;
    }

    const result = await deleteUser(userId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User deleted.");
      loadTherapists();
    }
  }

  async function handleCreateProfile(userId: string) {
    const result = await createTherapistProfileForUser(userId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile created. They can edit details from their dashboard.");
      loadTherapists();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Professionals</h1>
        <p className="text-muted-foreground">
          Manage registered professionals on your platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Professionals</CardTitle>
          <CardDescription>
            {therapists.length} professional{therapists.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : therapists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No professionals yet. Send an invite from the{" "}
              <a href="/admin/invites" className="text-primary underline">
                Invites
              </a>{" "}
              page.
            </p>
          ) : (
            <div className="space-y-3">
              {therapists.map((therapist) => {
                const status = therapist.therapist_profile?.status || "inactive";
                const price = therapist.therapist_profile?.session_price_cents;
                return (
                  <div
                    key={therapist.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{therapist.name || "Unnamed"}</p>
                      <p className="text-sm text-muted-foreground">{therapist.email}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{therapist.therapist_profile ? status : "no profile"}</span>
                        {price != null && (
                          <span>• ${(price / 100).toFixed(0)}/session</span>
                        )}
                        <span>• {therapist.therapist_profile?.video_provider || "daily"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!therapist.therapist_profile ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCreateProfile(therapist.id)}
                        >
                          Create Profile
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusToggle(therapist.id, status)}
                        >
                          {status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(therapist.id, therapist.name || "")}
                        className="text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
