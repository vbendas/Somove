"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ClientNote = Database["public"]["Tables"]["client_notes"]["Row"];

interface ActionResult<T = void> {
  data: T | null;
  error: { message: string } | null;
}

export async function getClientNotes(
  clientId: string
): Promise<ActionResult<ClientNote[]>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
      .from("client_notes")
      .select("*")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function getGeneralNote(
  clientId: string,
  therapistId: string
): Promise<ActionResult<ClientNote>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("client_notes")
      .select("*")
      .eq("client_id", clientId)
      .eq("therapist_id", therapistId)
      .is("session_id", null)
      .is("deleted_at", null)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function upsertNote(input: {
  id?: string;
  clientId: string;
  sessionId?: string | null;
  body: string;
}): Promise<ActionResult<ClientNote>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    if (input.id) {
      const { data, error } = await supabase
        .from("client_notes")
        .update({ body: input.body })
        .eq("id", input.id)
        .eq("therapist_id", user.id)
        .select()
        .single();

      if (error) return { data: null, error: { message: error.message } };
      return { data, error: null };
    }

    const { data, error } = await supabase
      .from("client_notes")
      .insert({
        therapist_id: user.id,
        client_id: input.clientId,
        session_id: input.sessionId || null,
        body: input.body,
      })
      .select()
      .single();

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function deleteNote(
  noteId: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { error } = await supabase
      .from("client_notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("therapist_id", user.id);

    if (error) return { data: null, error: { message: error.message } };
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function getLastNotePreview(
  clientId: string,
  therapistId: string
): Promise<string | null> {
  try {
    const supabase = createClient();

    const { data } = await supabase
      .from("client_notes")
      .select("body")
      .eq("client_id", clientId)
      .eq("therapist_id", therapistId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (!data?.body) return null;
    const firstLine = data.body.split("\n")[0];
    return firstLine.length > 60 ? firstLine.slice(0, 60) + "..." : firstLine;
  } catch {
    return null;
  }
}
