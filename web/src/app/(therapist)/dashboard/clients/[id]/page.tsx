"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ClientNote {
  id: string;
  body: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientProfile {
  id: string;
  name: string;
  email: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [activeTab, setActiveTab] = useState<"notes" | "sessions">("notes");
  const [generalNote, setGeneralNote] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: userData } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", clientId)
      .single();

    setClient(userData);

    const { data: notesData } = await supabase
      .from("client_notes")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    setNotes(notesData || []);

    const generalNoteRecord = notesData?.find((n) => !n.session_id);
    setGeneralNote(generalNoteRecord?.body || "");
  }, [clientId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveGeneralNote = async () => {
    setSaving(true);
    const generalNoteRecord = notes.find((n) => !n.session_id);

    if (generalNoteRecord) {
      await supabase
        .from("client_notes")
        .update({ body: generalNote })
        .eq("id", generalNoteRecord.id);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("client_notes").insert({
          therapist_id: user.id,
          client_id: clientId,
          body: generalNote,
        });
      }
    }

    setSaving(false);
    toast.success("Note saved");
    fetchData();
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("client_notes").delete().eq("id", noteId);
    toast.success("Note deleted");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center text-sm text-warm-gray hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to clients
        </button>

        {client && (
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-lg font-medium text-primary">
              {client.name?.charAt(0) || "?"}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-medium text-foreground">
                {client.name}
              </h1>
              <p className="text-sm text-warm-gray">{client.email}</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex gap-1 rounded-card bg-surface p-1">
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 rounded-button py-2 text-sm font-medium transition-colors ${
              activeTab === "notes"
                ? "bg-background text-foreground shadow-sm"
                : "text-warm-gray hover:text-foreground"
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex-1 rounded-button py-2 text-sm font-medium transition-colors ${
              activeTab === "sessions"
                ? "bg-background text-foreground shadow-sm"
                : "text-warm-gray hover:text-foreground"
            }`}
          >
            Sessions
          </button>
        </div>

        {activeTab === "notes" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-warm-gray">
                  General Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-warm-gray">
                  Do not record personally identifiable or sensitive clinical data. Use key observations only.
                </p>
                <Textarea
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  onBlur={saveGeneralNote}
                  placeholder="Write notes about this client..."
                  className="min-h-[150px]"
                />
                {saving && (
                  <p className="mt-2 text-xs text-warm-gray">Saving...</p>
                )}
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-warm-gray">
                Session Notes
              </h3>
              {notes
                .filter((n) => n.session_id)
                .map((note) => (
                  <Card key={note.id} className="mb-3">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <p className="text-xs text-warm-gray">
                          Session ·{" "}
                          {new Date(note.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-warm-gray hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-foreground">
                        {note.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-warm-gray">Session history coming soon</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
