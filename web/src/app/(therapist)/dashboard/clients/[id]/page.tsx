"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit3,
  X,
  Calendar,
  Clock,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import * as Collapsible from "@radix-ui/react-collapsible";

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

interface SessionInfo {
  id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
}

interface SessionGroup {
  session: SessionInfo;
  notes: ClientNote[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
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
          setLastSaved(
            `Saved ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
          );
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
      setLastSaved(`Saved ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`);
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
    if (!confirm("Delete this note?")) return;
    try {
      await supabase
        .from("client_notes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", noteId);
      toast.success("Note deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete note");
    }
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center text-sm text-warm-gray hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to clients
        </button>

        {client && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-heading text-xl font-medium text-primary">
                {client.name?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="font-heading text-2xl font-medium text-foreground">
                  {client.name}
                </h1>
                <p className="text-sm text-warm-gray">{client.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-warm-gray">
              {firstSessionDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Client since{" "}
                    {new Date(firstSessionDate).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{sessions.length} sessions</span>
              </div>
              {remainingCredits > 0 && (
                <div className="flex items-center gap-1 text-primary">
                  <CreditCard className="h-3 w-3" />
                  <span>
                    {remainingCredits} credit{remainingCredits !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
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
                    className="min-h-[200px] rounded-card border border-border p-4 prose prose-sm max-w-none text-foreground cursor-pointer hover:border-primary/30"
                    onClick={() => setIsGeneralEditing(true)}
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
              >
                {showFab ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
              </button>
            </div>

            {showFab && (
              <div className="fixed bottom-40 right-6 z-40 w-80 rounded-card border border-border bg-card p-4 shadow-lg">
                <p className="mb-2 text-sm font-medium text-foreground">Add Session Note</p>
                {sessions.length > 0 && (
                  <select
                    value={newNoteSessionId || ""}
                    onChange={(e) => setNewNoteSessionId(e.target.value || null)}
                    className="mb-3 w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="">General (no session)</option>
                    {sessions.slice(0, 10).map((s) => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.scheduled_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        — {s.status}
                      </option>
                    ))}
                  </select>
                )}
                <Textarea
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

        {activeTab === "sessions" && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-warm-gray">No sessions yet</p>
                </CardContent>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {new Date(session.scheduled_at).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-warm-gray">
                          {new Date(session.scheduled_at).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {session.duration_min} min
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          session.status === "completed"
                            ? "bg-accent/10 text-accent"
                            : session.status === "cancelled"
                            ? "bg-surface text-warm-gray"
                            : "bg-light-moss text-foreground"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineEditTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[100px] font-mono text-sm"
    />
  );
}

function SessionNoteGroup({
  group,
  editingNoteId,
  editingNoteBody,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onChangeEditBody,
}: {
  group: SessionGroup;
  editingNoteId: string | null;
  editingNoteBody: string;
  onStartEdit: (note: ClientNote) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  onChangeEditBody: (v: string) => void;
}) {
  const [open, setOpen] = useState(true);

  const sessionDate = new Date(group.session.scheduled_at);
  const label = `${sessionDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} — ${group.notes.length} note${group.notes.length !== 1 ? "s" : ""}`;

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Card>
        <Collapsible.Trigger asChild>
          <button className="flex w-full items-center justify-between p-4 text-left">
            <div className="flex items-center gap-2">
              {open ? (
                <ChevronDown className="h-4 w-4 text-warm-gray" />
              ) : (
                <ChevronRight className="h-4 w-4 text-warm-gray" />
              )}
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
            <span className="text-xs text-warm-gray">{group.session.duration_min} min</span>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="space-y-2 border-t border-border px-4 pb-4">
            {group.notes.map((note) => (
              <div key={note.id} className="rounded-card bg-surface p-3">
                <div className="mb-2 flex items-start justify-between">
                  <p className="text-xs text-warm-gray">
                    {new Date(note.updated_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex items-center gap-1">
                    {editingNoteId !== note.id && (
                      <button
                        onClick={() => onStartEdit(note)}
                        className="text-warm-gray hover:text-foreground"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(note.id)}
                      className="text-warm-gray hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {editingNoteId === note.id ? (
                  <div>
                    <InlineEditTextarea
                      value={editingNoteBody}
                      onChange={onChangeEditBody}
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onSaveEdit(note.id, editingNoteBody)}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-sm text-foreground">
                    <ReactMarkdown>{note.body || ""}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Collapsible.Content>
      </Card>
    </Collapsible.Root>
  );
}
