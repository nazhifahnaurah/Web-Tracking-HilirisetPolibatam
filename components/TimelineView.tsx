'use client';

import { useState } from 'react';
import { TimelineEntry } from '@/lib/types';
import { CheckCircle, Clock, AlertCircle, Paperclip, Pencil, Trash2 } from 'lucide-react';
import { AttachmentViewer } from './AttachmentViewer';

interface TimelineViewProps {
  entries: TimelineEntry[];
  onEdit?: (weekNumber: number) => void;
  onDelete?: (id: string) => void;
}

export function TimelineView({ entries, onEdit, onDelete }: TimelineViewProps) {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const completedEntries = entries.filter((e) => e.status === 'approved');
  const reviewingEntries = entries.filter((e) => e.status === 'reviewed');

  const StatusIcon = {
    approved: <CheckCircle className="h-5 w-5 text-green-500" />,
    reviewed: <Clock className="h-5 w-5 text-amber-500" />,
    pending: <AlertCircle className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Submitted</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{entries.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Reviewed</p>
          <p className="mt-2 text-2xl font-bold text-amber-500">{reviewingEntries.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="mt-2 text-2xl font-bold text-green-500">{completedEntries.length}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Progress Timeline</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">No entries yet. Start submitting your weekly progress.</p>
            </div>
          ) : (
            entries
              .sort((a, b) => b.weekNumber - a.weekNumber)
              .map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border bg-card/50 hover:border-primary transition-colors">
                  {/* Expand / collapse row */}
                  <button
                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                    className="w-full text-left p-3"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center pt-1">
                        {StatusIcon[entry.status]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-foreground">Week {entry.weekNumber}</p>
                          <div className="flex items-center gap-2">
                            {entry.attachments && entry.attachments.length > 0 && (
                              <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                                <Paperclip className="h-3 w-3" />
                                {entry.attachments.length}
                              </span>
                            )}
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-medium">
                              {entry.status}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-foreground line-clamp-2">{entry.accomplishment}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(entry.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Edit / Delete actions */}
                  {(onEdit || onDelete) && (
                    <div className="flex items-center gap-2 px-3 pb-3 border-t border-border pt-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(entry.weekNumber)}
                          className="flex items-center gap-1 text-xs px-3 py-1 rounded-md border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        deleteConfirm === entry.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-destructive font-medium">Hapus entri ini?</span>
                            <button
                              onClick={() => { onDelete(entry.id); setDeleteConfirm(null); }}
                              className="text-xs px-3 py-1 rounded-md bg-destructive text-white hover:bg-destructive/90 transition-colors"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs px-3 py-1 rounded-md border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md border border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* Attachment viewer */}
                  {expandedEntry === entry.id && entry.attachments && entry.attachments.length > 0 && (
                    <div className="px-3 pb-3 border-t border-border">
                      <AttachmentViewer attachments={entry.attachments} />
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
