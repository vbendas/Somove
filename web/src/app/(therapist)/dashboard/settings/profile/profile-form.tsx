"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

export function ProfileForm({ initial }: { initial: { bio: string } }) {
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState(initial.bio);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("therapist_profile")
        .update({ bio })
        .eq("user_id", user.id);

      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="profileBio" className="mb-1 block text-sm font-medium text-foreground">
            About You
          </label>
          <Textarea
            id="profileBio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <Button onClick={saveProfile} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
