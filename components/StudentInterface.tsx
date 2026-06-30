'use client';

import { useRef, useState } from 'react';
import { Student } from '@/lib/types';
import { TimelineForm, TimelineFormHandle } from './TimelineForm';
import { TimelineView } from './TimelineView';
import { DownloadCloud } from 'lucide-react';
import { WEEKS, TOTAL_WEEKS } from '@/lib/weeks';

interface StudentInterfaceProps {
  student: Student;
  weekNumber: number;
  onWeekChange: (week: number) => void;
  getStudentEntries: (studentId: string) => any[];
  getWeekData: (studentId: string, weekNumber: number) => any;
  addTimelineEntry: (entry: any) => void;
  deleteTimelineEntry: (id: string) => void;
}

export function StudentInterface({
  student,
  weekNumber,
  onWeekChange,
  getStudentEntries,
  getWeekData,
  addTimelineEntry,
  deleteTimelineEntry,
}: StudentInterfaceProps) {

  const formSectionRef = useRef<HTMLDivElement>(null);
  const timelineFormRef = useRef<TimelineFormHandle>(null);

  const entries = getStudentEntries(student.id);
  const weekData = getWeekData(student.id, weekNumber);
  const weekInfo = WEEKS[weekNumber - 1];

  const handleEdit = (weekNum: number) => {
    onWeekChange(weekNum);
    // Wait for React to render (possibly remounting the form via key change), then open it
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        timelineFormRef.current?.openForm();
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const handleExport = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Progress');

    const imgColWidth = 22; // ~150px

    sheet.columns = [
      { header: 'Tahun', key: 'year', width: 8 },
      { header: 'Minggu ke-', key: 'week', width: 10 },
      { header: 'Label', key: 'label', width: 28 },
      { header: 'Accomplishment', key: 'acc', width: 40 },
      { header: 'Blockers', key: 'blockers', width: 35 },
      { header: 'Next Week Plans', key: 'next', width: 35 },
      { header: 'Supervisor Feedback', key: 'feedback', width: 35 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Gambar 1', key: 'img1', width: imgColWidth },
      { header: 'Gambar 2', key: 'img2', width: imgColWidth },
      { header: 'Gambar 3', key: 'img3', width: imgColWidth },
    ];

    // Bold header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).height = 18;

    const extMap: Record<string, 'jpeg' | 'png' | 'gif'> = {
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/png': 'png',
      'image/gif': 'gif',
    };

    for (const e of entries) {
      const wi = WEEKS[e.weekNumber - 1];
      const imageAtts = (e.attachments ?? []).filter((a: any) => a.fileType === 'image').slice(0, 3);

      const row = sheet.addRow({
        year: wi?.year ?? '',
        week: wi?.weekInMonth ?? e.weekNumber,
        label: wi?.label ?? `Week ${e.weekNumber}`,
        acc: e.accomplishment,
        blockers: e.blockers,
        next: e.nextWeek,
        feedback: e.supervisorFeedback ?? '',
        status: e.status,
      });

      row.alignment = { wrapText: true, vertical: 'top' };

      if (imageAtts.length > 0) {
        row.height = 130;

        imageAtts.forEach((att: any, idx: number) => {
          try {
            const base64 = att.data.split(',')[1];
            const ext = extMap[att.mimeType] ?? 'png';
            const imageId = workbook.addImage({ base64, extension: ext });
            sheet.addImage(imageId, {
              tl: { col: 8 + idx, row: row.number - 1 } as any,
              ext: { width: 150, height: 120 },
            });
          } catch {
            // skip invalid image
          }
        });
      } else {
        row.height = 60;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracker-${student.name.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const approved = entries.filter((e: any) => e.status === 'approved').length;
  const reviewed = entries.filter((e: any) => e.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-muted-foreground">Student Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">{student.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ID: {student.studentId} • Team: {student.team || 'N/A'}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={entries.length === 0}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
        >
          <DownloadCloud className="h-4 w-4" />
          Export to Excel
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div ref={formSectionRef} className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-muted-foreground">
                {weekInfo ? `${weekInfo.year} · ${weekInfo.label}` : `WEEK ${weekNumber}`}
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <TimelineForm
                ref={timelineFormRef}
                key={weekNumber}
                student={student}
                weekNumber={weekNumber}
                existingEntry={weekData}
                milestoneTitle={weekInfo?.label}
                onSubmit={addTimelineEntry}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h3>
            <TimelineView
              entries={entries}
              onEdit={handleEdit}
              onDelete={deleteTimelineEntry}
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground">Quick Stats</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Submissions</span>
                <span className="font-bold text-foreground">{entries.length} / {TOTAL_WEEKS}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                  style={{ width: `${Math.min((entries.length / TOTAL_WEEKS) * 100, 100)}%` }}
                />
              </div>
              <div className="pt-2 text-xs text-muted-foreground space-y-1">
                <div>Approved: {approved}</div>
                <div>In Review: {reviewed}</div>
                <div>Pending: {entries.length - approved - reviewed}</div>
              </div>
            </div>
          </div>

          {entries.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold text-foreground">Submitted Weeks</h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {entries.map((e: any) => {
                  const wi = WEEKS[e.weekNumber - 1];
                  return (
                    <button
                      key={e.weekNumber}
                      onClick={() => onWeekChange(e.weekNumber)}
                      className={`w-full text-left rounded-lg px-3 py-2 transition-colors text-sm ${
                        e.weekNumber === weekNumber
                          ? 'bg-primary text-primary-foreground font-medium'
                          : e.status === 'approved'
                            ? 'bg-green-500/20 text-foreground hover:bg-green-500/30'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <span className="font-medium">
                        {wi ? `${wi.monthLabel} · Week ${wi.weekInMonth}` : `Week ${e.weekNumber}`}
                      </span>
                      {e.status === 'approved' && <span className="ml-1 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
