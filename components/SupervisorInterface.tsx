'use client';

import { Supervisor, Student, TimelineEntry } from '@/lib/types';
import { useState } from 'react';
import { MessageSquare, CheckCircle, Paperclip } from 'lucide-react';
import { AttachmentViewer } from './AttachmentViewer';
import { WEEKS } from '@/lib/weeks';

interface SupervisorInterfaceProps {
  supervisor: Supervisor;
  students: Student[];
  selectedStudent: string | null;
  weekNumber: number;
  onStudentChange: (studentId: string) => void;
  onWeekChange: (week: number) => void;
  updateTimelineEntry: (id: string, updates: any) => void;
  timelineEntries: TimelineEntry[];
}

export function SupervisorInterface({
  supervisor,
  students,
  selectedStudent,
  weekNumber,
  onStudentChange,
  onWeekChange,
  updateTimelineEntry,
  timelineEntries,
}: SupervisorInterfaceProps) {
  const [feedback, setFeedback] = useState('');
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [expandedAttachments, setExpandedAttachments] = useState(false);

  const currentStudent = students.find((s) => s.id === selectedStudent);
  const weekData = selectedStudent
    ? timelineEntries.find((e) => e.studentId === selectedStudent && e.weekNumber === weekNumber)
    : undefined;
  const weekInfo = WEEKS[weekNumber - 1];

  const handleSubmitFeedback = () => {
    if (!weekData || !feedback.trim()) return;
    updateTimelineEntry(weekData.id, {
      supervisorFeedback: feedback,
      feedbackDate: new Date().toISOString(),
      status: 'reviewed',
    });
    setFeedback('');
    setFeedbackMode(false);
  };

  const handleApprove = () => {
    if (!weekData) return;
    updateTimelineEntry(weekData.id, { status: 'approved' });
  };

  // Weeks that this student has submitted, for quick jump
  const submittedWeekNumbers = selectedStudent
    ? timelineEntries
        .filter((e) => e.studentId === selectedStudent)
        .map((e) => e.weekNumber)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Supervisor Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">{supervisor.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overseeing {students.length} students</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Student List */}
        <div className="rounded-lg border border-border bg-card p-4 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-foreground">Students</h3>
          <div className="space-y-2">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => onStudentChange(student.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedStudent === student.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <div className="font-medium">{student.name}</div>
                <div className="text-xs opacity-75">{student.studentId}</div>
              </button>
            ))}
          </div>

          {/* Submitted weeks quick-jump */}
          {submittedWeekNumbers.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Minggu disubmit</p>
              <div className="flex flex-wrap gap-1">
                {submittedWeekNumbers.map((wn) => (
                  <button
                    key={wn}
                    onClick={() => onWeekChange(wn)}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      wn === weekNumber
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    W{WEEKS[wn - 1]?.weekInMonth ?? wn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Review Area */}
        <div className="lg:col-span-3 space-y-4">
          {!currentStudent ? (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">Select a student to review their progress</p>
            </div>
          ) : !weekData ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                Belum ada submission untuk{' '}
                <span className="font-medium text-foreground">
                  {weekInfo?.label ?? `Minggu ${weekNumber}`}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Gunakan WeekPicker di atas untuk berpindah ke minggu lain.
              </p>
            </div>
          ) : (
            <>
              {/* Submission Review */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Submission</p>
                    <h2 className="mt-1 text-xl font-bold text-foreground">
                      {weekInfo?.label ?? `Minggu ${weekNumber}`}
                    </h2>
                  </div>
                  <span
                    className={`inline-block rounded px-3 py-1 text-xs font-medium ${
                      weekData.status === 'approved'
                        ? 'bg-green-500/20 text-green-700'
                        : weekData.status === 'reviewed'
                          ? 'bg-amber-500/20 text-amber-700'
                          : 'bg-blue-500/20 text-blue-700'
                    }`}
                  >
                    {weekData.status}
                  </span>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">ACCOMPLISHMENTS</h3>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">{weekData.accomplishment}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">BLOCKERS</h3>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">{weekData.blockers}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">NEXT WEEK PLANS</h3>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">{weekData.nextWeek}</p>
                  </div>

                  {weekData.attachments && weekData.attachments.length > 0 && (
                    <div>
                      <button
                        onClick={() => setExpandedAttachments(!expandedAttachments)}
                        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Paperclip className="h-4 w-4" />
                        Attachments ({weekData.attachments.length})
                      </button>
                      {expandedAttachments && (
                        <div className="mt-4 rounded-lg bg-secondary/30 border border-border p-4">
                          <AttachmentViewer attachments={weekData.attachments} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground">
                      Submitted: {new Date(weekData.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="rounded-lg border border-border bg-card p-6">
                {weekData.supervisorFeedback && !feedbackMode ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Your Feedback</h3>
                    <div className="rounded-lg bg-secondary/50 p-4">
                      <p className="text-foreground whitespace-pre-wrap">{weekData.supervisorFeedback}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {weekData.feedbackDate ? new Date(weekData.feedbackDate).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setFeedbackMode(true)}
                      className="text-sm text-accent hover:text-accent/90"
                    >
                      Edit Feedback
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">
                        <MessageSquare className="mr-1 inline h-4 w-4" />
                        ADD FEEDBACK
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide constructive feedback to the student..."
                        className="mt-2 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmitFeedback}
                        disabled={!feedback.trim()}
                        className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {weekData.supervisorFeedback ? 'Update' : 'Submit'} Feedback
                      </button>
                      {feedbackMode && (
                        <button
                          onClick={() => { setFeedback(''); setFeedbackMode(false); }}
                          className="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-secondary"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Approve Button */}
              {weekData.status !== 'approved' && (
                <button
                  onClick={handleApprove}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
                >
                  <CheckCircle className="h-5 w-5" />
                  Approve Submission
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
