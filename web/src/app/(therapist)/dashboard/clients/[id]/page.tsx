"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate, formatTime } from "@/lib/format";
import { ClientHeader, type ClientProfile } from "./client-header";
import { SessionHistoryList, type SessionInfo } from "./session-history-list";
import { SessionNoteGroup, type ClientNote, type SessionGroup } from "./session-note-group";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeTab, setActiveTab] = useState<"notes" | "sessions">("notes");

  const [generalNote, setGeneralNote] = useState("");
  const [generalNoteId, setGeneralNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [isGeneralEditing, setIsGeneralEditing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");

  const [firstSessionDate, setFirstSessionDate] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState(0);

  const [showFab, setShowFab] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteSessionId, setNewNoteSessionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    setNotes(notesData || []);

    const generalNoteRecord = notesData?.find((n) => !n.session_id);
    setGeneralNote(generalNoteRecord?.body || "");
    setGeneralNoteId(generalNoteRecord?.id || null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: firstSession } = await supabase
        .from("sessions")
        .select("scheduled_at")
        .eq("client_id", clientId)
        .eq("therapist_id", user.id)
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .single();

      if (firstSession) {
        setFirstSessionDate(firstSession.scheduled_at);
      }

      const { data: credits } = await supabase
        .from("session_credits")
        .select("remaining_credits")
        .eq("client_id", clientId)
        .eq("therapist_id", user.id)
        .gt("remaining_credits", 0);

      const total = credits?.reduce((sum, c) => sum + c.remaining_credits, 0) || 0;
      setRemainingCredits(total);
    }

    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("id, scheduled_at, duration_min, status")
      .eq("client_id", clientId)
      .order("scheduled_at", { ascending: false });

    setSessions(sessionsData || []);
  }, [clientId, supabase]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const debouncedSave = useCallback(
    (noteId: string | null, body: string, clientIdVal: string, sessionId?: string | null) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          if (noteId) {
            const { error } = await supabase
              .from("client_notes")
              .update({ body })
              .eq("id", noteId);
            if (error) throw error;
          } else {
            const { data, error } = await supabase
              .from("client_notes")
              .insert({
                therapist_id: user.id,
                client_id: clientIdVal,
                session_id: sessionId || null,
                body,
              })
              .select()
              .single();
            if (error) throw error;
            if (data) setGeneralNoteId(data.id);
          }

          const now = new Date();
          setLastSaved(`Saved ${formatTime(now)}`);
        } catch {
          toast.error("Failed to save note");
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [supabase]
  );

  const handleGeneralChange = (value: string) => {
    setGeneralNote(value);
    debouncedSave(generalNoteId, value, clientId);
  };

  const handleGeneralBlur = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (generalNoteId) {
        await supabase
          .from("client_notes")
          .update({ body: generalNote })
          .eq("id", generalNoteId);
      } else {
        const { data } = await supabase
          .from("client_notes")
          .insert({
            therapist_id: user.id,
            client_id: clientId,
            body: generalNote,
          })
          .select()
          .single();
        if (data) setGeneralNoteId(data.id);
      }

      const now = new Date();
      setLastSaved(`Saved ${formatTime(now)}`);
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const saveSessionNote = async (noteId: string, body: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("client_notes")
        .update({ body })
        .eq("id", noteId);
      if (error) throw error;
      setEditingNoteId(null);
      setEditingNoteBody("");
      toast.success("Note saved");
      fetchData();
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const deleteNoteHandler = async (noteId: string) => {
    setConfirmDelete(noteId);
  };

  const confirmDeleteHandler = async () => {
    if (!confirmDelete) return;
    try {
      await supabase
        .from("client_notes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", confirmDelete);
      toast.success("Note deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete note");
    }
    setConfirmDelete(null);
  };

  const addNewNote = async () => {
    if (!newNoteBody.trim()) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("client_notes").insert({
        therapist_id: user.id,
        client_id: clientId,
        session_id: newNoteSessionId,
        body: newNoteBody,
      });

      setNewNoteBody("");
      setNewNoteSessionId(null);
      setShowFab(false);
      toast.success("Note added");
      fetchData();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  const sessionGroups: SessionGroup[] = sessions.map((session) => ({
    session,
    notes: notes.filter((n) => n.session_id === session.id),
  })).filter((g) => g.notes.length > 0);

  return (
    <PageContainer width="narrow">
      <PageHeader
        title={client?.name || "Client"}
        description={client?.email}
        backHref="/dashboard/clients"
      />

      {client && (
        <ClientHeader
          client={client}
          firstSessionDate={firstSessionDate}
          sessionsCount={sessions.length}
          remainingCredits={remainingCredits}
        />
      )}

      <div className="mb-6 flex gap-1 rounded-card bg-surface p-1">
        <button
          onClick={() => setActiveTab("notes")}
          aria-pressed={activeTab === "notes"}
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
          aria-pressed={activeTab === "sessions"}
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-warm-gray">
                  General Notes
                </CardTitle>
                <div className="flex items-center gap-2">
                  {(saving || lastSaved) && (
                    <span className="text-xs text-warm-gray">
                      {saving ? "Saving..." : lastSaved}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsGeneralEditing(!isGeneralEditing)}
                  >
                    {isGeneralEditing ? "Preview" : "Edit"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-warm-gray">
                Do not record personally identifiable or sensitive clinical data. Use key observations only.
              </p>
              {isGeneralEditing ? (
                <Textarea
                  ref={textareaRef}
                  value={generalNote}
                  onChange={(e) => handleGeneralChange(e.target.value)}
                  onBlur={handleGeneralBlur}
                  placeholder="Write notes about this client..."
                  className="min-h-[200px] font-mono text-sm"
                />
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Edit general notes"
                  className="min-h-[200px] rounded-card border border-border p-4 prose prose-sm max-w-none text-foreground cursor-pointer hover:border-primary/30"
                  onClick={() => setIsGeneralEditing(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsGeneralEditing(true);
                    }
                  }}
                >
                  {generalNote ? (
                    <ReactMarkdown>{generalNote}</ReactMarkdown>
                  ) : (
                    <p className="text-warm-gray italic">
                      Click to add notes...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-warm-gray">
              Session Notes
            </h3>
            {sessionGroups.length === 0 ? (
              <p className="text-sm text-warm-gray">No session notes yet</p>
            ) : (
              <div className="space-y-3">
                {sessionGroups.map((group) => (
                  <SessionNoteGroup
                    key={group.session.id}
                    group={group}
                    editingNoteId={editingNoteId}
                    editingNoteBody={editingNoteBody}
                    onStartEdit={(note) => {
                      setEditingNoteId(note.id);
                      setEditingNoteBody(note.body || "");
                    }}
                    onCancelEdit={() => {
                      setEditingNoteId(null);
                      setEditingNoteBody("");
                    }}
                    onChangeEditBody={setEditingNoteBody}
                    onSaveEdit={(id, body) => saveSessionNote(id, body)}
                    onDelete={deleteNoteHandler}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="fixed bottom-24 right-6 z-40">
            <button
              onClick={() => setShowFab(!showFab)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-dark transition-colors"
              aria-label={showFab ? "Close menu" : "Add note"}
            >
              {showFab ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </button>
          </div>

          {showFab && (
            <div className="fixed bottom-40 right-6 z-40 w-80 rounded-card border border-border bg-card p-4 shadow-lg">
              <p className="mb-2 text-sm font-medium text-foreground">Add Session Note</p>
              {sessions.length > 0 && (
                <select
                  aria-label="Session for note"
                  value={newNoteSessionId || ""}
                  onChange={(e) => setNewNoteSessionId(e.target.value || null)}
                  className="mb-3 w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">General (no session)</option>
                  {sessions.slice(0, 10).map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDate(s.scheduled_at, "short")} — {s.status}
                    </option>
                  ))}
                </select>
              )}
              <Textarea
                aria-label="Note body"
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="Write a note..."
                className="mb-3 min-h-[100px]"
              />
              <Button
                size="sm"
                onClick={addNewNote}
                disabled={!newNoteBody.trim() || saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Add Note"}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "sessions" && <SessionHistoryList sessions={sessions} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-desc"
            className="relative mx-4 w-full max-w-sm rounded-card border border-border bg-card p-6 shadow-lg"
          >
            <h2 id="confirm-delete-title" className="font-heading text-lg font-medium text-foreground">
              Delete Note
            </h2>
            <p id="confirm-delete-desc" className="mt-2 text-sm text-warm-gray">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmDeleteHandler}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
