"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SessionType = Database["public"]["Tables"]["session_types"]["Row"];
type SessionTypeInsert = Database["public"]["Tables"]["session_types"]["Insert"];
type SessionTypeUpdate = Database["public"]["Tables"]["session_types"]["Update"];

interface ActionResult<T = void> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export async function getSessionTypes(): Promise<ActionResult<SessionType[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
      .from("session_types")
      .select("*")
      .eq("therapist_id", user.id)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Unknown error" } };
  }
}

export async function getActiveSessionTypes(therapistId: string): Promise<ActionResult<SessionType[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("session_types")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Unknown error" } };
  }
}

export async function createSessionType(
  input: Omit<SessionTypeInsert, "therapist_id">
): Promise<ActionResult<SessionType>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
      .from("session_types")
      .insert({ ...input, therapist_id: user.id })
      .select()
      .single();

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Unknown error" } };
  }
}

export async function updateSessionType(
  id: string,
  input: SessionTypeUpdate
): Promise<ActionResult<SessionType>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
      .from("session_types")
      .update(input)
      .eq("id", id)
      .eq("therapist_id", user.id)
      .select()
      .single();

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Unknown error" } };
  }
}

export async function deleteSessionType(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { error } = await supabase
      .from("session_types")
      .delete()
      .eq("id", id)
      .eq("therapist_id", user.id);

    if (error) return { data: null, error: { message: error.message } };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Unknown error" } };
  }
}

export async function toggleSessionTypeActive(
  id: string,
  isActive: boolean
): Promise<ActionResult<SessionType>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
      .from("session_types")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("therapist_id", user.id)
      .select()
      .single();

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Unknown error" } };
  }
}

export async function saveTermsOfService(
  tosText: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data: current } = await supabase
      .from("therapist_profile")
      .select("tos_text, tos_version")
      .eq("user_id", user.id)
      .single();

    const newVersion = (current?.tos_version || 0) + 1;

    const { error } = await supabase
      .from("therapist_profile")
      .update({
        tos_text: tosText || null,
        tos_version: tosText ? newVersion : (current?.tos_version || 1),
      })
      .eq("user_id", user.id);

    if (error) return { data: null, error: { message: error.message } };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Unknown error" } };
  }
}
