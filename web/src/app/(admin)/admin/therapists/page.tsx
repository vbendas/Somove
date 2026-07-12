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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/format";
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
    <PageContainer width="full">
      <PageHeader
        title="Professionals"
        description="Manage registered professionals on your platform."
      />

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {therapists.map((therapist) => {
                  const status = therapist.therapist_profile?.status || "inactive";
                  const price = therapist.therapist_profile?.session_price_cents;
                  return (
                    <TableRow key={therapist.id}>
                      <TableCell className="font-medium">{therapist.name || "Unnamed"}</TableCell>
                      <TableCell className="text-muted-foreground">{therapist.email}</TableCell>
                      <TableCell className="capitalize">
                        {therapist.therapist_profile ? status : "no profile"}
                      </TableCell>
                      <TableCell>
                        {price != null ? `${formatCurrency(price)}/session` : "—"}
                      </TableCell>
                      <TableCell>{therapist.therapist_profile?.video_provider || "daily"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
