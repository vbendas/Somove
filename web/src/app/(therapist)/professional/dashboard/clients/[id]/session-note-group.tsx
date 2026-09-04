"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Edit3, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import * as Collapsible from "@radix-ui/react-collapsible";
import { formatDate, formatDateTime } from "@/lib/format";

export interface ClientNote {
  id: string;
  body: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionInfo {
  id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
}

export interface SessionGroup {
  session: SessionInfo;
  notes: ClientNote[];
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

interface SessionNoteGroupProps {
  group: SessionGroup;
  editingNoteId: string | null;
  editingNoteBody: string;
  onStartEdit: (note: ClientNote) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  onChangeEditBody: (v: string) => void;
}

export function SessionNoteGroup({
  group,
  editingNoteId,
  editingNoteBody,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onChangeEditBody,
}: SessionNoteGroupProps) {
  const [open, setOpen] = useState(true);

  const label = `${formatDate(group.session.scheduled_at, "long")} — ${group.notes.length} note${group.notes.length !== 1 ? "s" : ""}`;

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
                    {formatDateTime(note.updated_at)}
                  </p>
                  <div className="flex items-center gap-1">
                    {editingNoteId !== note.id && (
                      <button
                        onClick={() => onStartEdit(note)}
                        className="text-warm-gray hover:text-foreground"
                        aria-label="Edit note"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(note.id)}
                      className="text-warm-gray hover:text-red-500"
                      aria-label="Delete note"
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
