"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export interface Invite {
  id: string;
  email: string;
  token: string;
  role: string;
  invited_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export async function createInvite(email: string, role: "therapist" | "admin" = "therapist") {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return { error: "Only admins can send invites." };
  }

  // Check if invite already exists for this email (pending)
  const adminClient = createAdminClient();
  const { data: existingInvite } = await adminClient
    .from("invites")
    .select("id")
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingInvite) {
    return { error: "An active invite already exists for this email." };
  }

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");

  // Create invite
  const { error } = await adminClient.from("invites").insert({
    email,
    token,
    role,
    invited_by: user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    return { error: `Failed to create invite: ${error.message}` };
  }

  // TODO: Send invite email via Resend
  // For now, return the token so admin can share it manually
  revalidatePath("/admin/invites", "page");

  return {
    success: true,
    inviteUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/${token}`,
    message: `Invite created. Share this link: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/${token}`,
  };
}

export async function getInvites() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { invites: [] };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return { invites: [] };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { invites: [] };

  return { invites: data as Invite[] };
}

export async function deleteInvite(inviteId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return { error: "Only admins can delete invites." };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("invites")
    .delete()
    .eq("id", inviteId);

  if (error) return { error: `Failed to delete invite: ${error.message}` };

  revalidatePath("/admin/invites", "page");
  return { success: true };
}

export async function validateInviteToken(token: string) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("invites")
    .select("id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: "Invalid invite link." };
  }

  if (data.accepted_at) {
    return { valid: false, error: "This invite has already been used." };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: "This invite has expired." };
  }

  return { valid: true, invite: data };
}

export async function acceptInvite(token: string, name: string, password: string) {
  const adminClient = createAdminClient();

  // Validate token
  const { valid, invite, error: validateError } = await validateInviteToken(token);
  if (!valid) {
    return { error: validateError };
  }

  // Create user via Supabase Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: invite!.email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: `Failed to create account: ${authError.message}` };
  }

  // Update user profile
  const { error: updateError } = await adminClient
    .from("users")
    .update({
      name,
      role: invite!.role as "therapist" | "admin",
    })
    .eq("id", authData.user.id);

  if (updateError) {
    return { error: `Failed to update profile: ${updateError.message}` };
  }

  // Mark invite as accepted
  await adminClient
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite!.id);

  return { success: true, role: invite!.role };
}

export async function resendInvite(inviteId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return { error: "Only admins can resend invites." };

  const adminClient = createAdminClient();

  // Extend expiry by 7 days
  const { error } = await adminClient
    .from("invites")
    .update({
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", inviteId)
    .is("accepted_at", null);

  if (error) return { error: `Failed to resend invite: ${error.message}` };

  // Get the token for the new URL
  const { data: invite } = await adminClient
    .from("invites")
    .select("token")
    .eq("id", inviteId)
    .single();

  revalidatePath("/admin/invites", "page");

  return {
    success: true,
    inviteUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/${invite?.token}`,
  };
}
