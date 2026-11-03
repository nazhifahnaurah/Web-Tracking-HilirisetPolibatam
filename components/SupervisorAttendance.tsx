'use client';

import { useEffect, useState } from 'react';
import { Student } from '@/lib/types';
import { useAttendance } from '@/lib/useAttendance';
import { usePermissions } from '@/lib/usePermissions';
import {
  AttendanceRecord,
  MIN_WORK_HOURS,
  checkInStatus,
  formatDurationHours,
  todayDateString,
  workDurationHours,
} from '@/lib/attendance';
import { PERMISSION_TYPE_LABELS, PermissionRecord } from '@/lib/permission';
import { ChevronLeft, ChevronRight, DownloadCloud, MapPin, Trash2, X } from 'lucide-react';

interface SupervisorAttendanceProps {
  students: Student[];
}

function startOfMonthString(): string {
  const d = new Date();
  d.setDate(1);
  return todayDateString(d);
}

export function SupervisorAttendance({ students }: SupervisorAttendanceProps) {
  const { fetchRecordsForDateAll, fetchRecordsForStudentRange, deleteAttendance } = useAttendance();
  const { fetchPermissionsForDateAll } = usePermissions();
  const [date, setDate] = useState(todayDateString());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [confirmingStudentId, setConfirmingStudentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportStudentId, setExportStudentId] = useState(students[0]?.id ?? '');
  const [exportStart, setExportStart] = useState(startOfMonthString());
  const [exportEnd, setExportEnd] = useState(todayDateString());
  const [exporting, setExporting] = useState(false);

  const reload = () => fetchRecordsForDateAll(date).then(setRecords);

  useEffect(() => {
    setLoading(true);
    fetchRecordsForDateAll(date).then((r) => {
      setRecords(r);
      setLoading(false);
    });
    fetchPermissionsForDateAll(date).then(setPermissions);
  }, [date, fetchRecordsForDateAll, fetchPermissionsForDateAll]);

  const handleDelete = async (checkIn?: AttendanceRecord, checkOut?: AttendanceRecord) => {
    setDeleting(true);
    for (const record of [checkIn, checkOut]) {
      if (record) await deleteAttendance(record.id);
    }
    await reload();
    setDeleting(false);
    setConfirmingStudentId(null);
  };

  const shiftDate = (deltaDays: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + deltaDays);
    setDate(todayDateString(d));
  };

  const fmtTime = (r?: AttendanceRecord) =>
    r ? new Date(r.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

  const handleExportStudent = async () => {
    const student = students.find((s) => s.id === exportStudentId);
    if (!student) return;

    setExporting(true);
    try {
      const rangeRecords = await fetchRecordsForStudentRange(exportStudentId, exportStart, exportEnd);

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Presensi');

      sheet.columns = [
        { header: 'Tanggal', key: 'date', width: 20 },
        { header: 'Datang', key: 'checkIn', width: 10 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Pulang', key: 'checkOut', width: 10 },
        { header: 'Durasi', key: 'duration', width: 16 },
        { header: 'Jarak Datang (m)', key: 'distIn', width: 16 },
        { header: 'Jarak Pulang (m)', key: 'distOut', width: 16 },
        { header: 'Foto Datang', key: 'photoIn', width: 14 },
        { header: 'Foto Pulang', key: 'photoOut', width: 14 },
      ];
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).height = 18;

      const linkStyle = { color: { argb: 'FF0563C1' }, underline: true };
      const dates = Array.from(new Set(rangeRecords.map((r) => r.date))).sort();

      for (const d of dates) {
        const checkIn = rangeRecords.find((r) => r.date === d && r.type === 'check_in');
        const checkOut = rangeRecords.find((r) => r.date === d && r.type === 'check_out');
        const duration = checkIn && checkOut ? workDurationHours(checkIn.recordedAt, checkOut.recordedAt) : null;
        const checkInLiveStatus = checkIn ? checkInStatus(new Date(checkIn.recordedAt)) : null;

        const row = sheet.addRow({
          date: new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          checkIn: fmtTime(checkIn),
          status: !checkIn ? 'Tidak Hadir' : checkInLiveStatus === 'terlambat' ? 'Terlambat' : 'Tepat Waktu',
          checkOut: fmtTime(checkOut),
          duration: duration === null ? '-' : formatDurationHours(duration),
          distIn: checkIn ? Math.round(checkIn.distanceMeters) : '-',
          distOut: checkOut ? Math.round(checkOut.distanceMeters) : '-',
        });

        if (checkIn) {
          row.getCell('photoIn').value = { text: 'Lihat Foto', hyperlink: checkIn.photoUrl };
          row.getCell('photoIn').font = linkStyle;
        }
        if (checkOut) {
          row.getCell('photoOut').value = { text: 'Lihat Foto', hyperlink: checkOut.photoUrl };
          row.getCell('photoOut').font = linkStyle;
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presensi-${student.name.toLowerCase().replace(/\s+/g, '-')}-${exportStart}_${exportEnd}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Presensi Harian</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">Rekap Presensi Mahasiswa</h2>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Mahasiswa</label>
          <select
            value={exportStudentId}
            onChange={(e) => setExportStudentId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Dari</label>
          <input
            type="date"
            value={exportStart}
            onChange={(e) => setExportStart(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Sampai</label>
          <input
            type="date"
            value={exportEnd}
            onChange={(e) => setExportEnd(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <button
          onClick={handleExportStudent}
          disabled={!exportStudentId || exporting}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DownloadCloud className="h-4 w-4" />
          {exporting ? 'Mengekspor...' : 'Export Excel'}
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <button
          onClick={() => shiftDate(-1)}
          className="rounded-lg border border-border bg-secondary p-2 hover:bg-secondary/80"
          aria-label="Tanggal sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center font-semibold text-foreground">
          {new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
        <button
          onClick={() => shiftDate(1)}
          className="rounded-lg border border-border bg-secondary p-2 hover:bg-secondary/80"
          aria-label="Tanggal berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {date !== todayDateString() && (
          <button
            onClick={() => setDate(todayDateString())}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary"
          >
            Hari Ini
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Mahasiswa</th>
                  <th className="py-2 pr-4 font-medium">Datang</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Pulang</th>
                  <th className="py-2 pr-4 font-medium">Durasi</th>
                  <th className="py-2 pr-4 font-medium">Keterangan</th>
                  <th className="py-2 pr-4 font-medium">Foto</th>
                  <th className="py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const checkIn = records.find((r) => r.studentId === student.id && r.type === 'check_in');
                  const checkOut = records.find((r) => r.studentId === student.id && r.type === 'check_out');
                  const duration =
                    checkIn && checkOut ? workDurationHours(checkIn.recordedAt, checkOut.recordedAt) : null;
                  const checkInLiveStatus = checkIn ? checkInStatus(new Date(checkIn.recordedAt)) : null;
                  const permission = permissions.find((p) => p.studentId === student.id);
                  return (
                    <tr key={student.id} className="border-b border-border/50">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-foreground">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.studentId}</div>
                      </td>
                      <td className="py-3 pr-4 text-foreground">{fmtTime(checkIn)}</td>
                      <td className="py-3 pr-4">
                        {!checkIn ? (
                          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Tidak Hadir
                          </span>
                        ) : checkInLiveStatus === 'terlambat' ? (
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Terlambat
                          </span>
                        ) : (
                          <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-700">
                            Tepat Waktu
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-foreground">{fmtTime(checkOut)}</td>
                      <td className="py-3 pr-4">
                        {duration === null ? (
                          <span className="text-muted-foreground">-</span>
                        ) : duration < MIN_WORK_HOURS ? (
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {formatDurationHours(duration)} ⚠
                          </span>
                        ) : (
                          <span className="text-foreground">{formatDurationHours(duration)}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 max-w-[220px]">
                        {permission ? (
                          <div className="text-xs">
                            <span
                              className={`inline-block rounded px-2 py-0.5 font-medium ${
                                permission.type === 'sakit'
                                  ? 'bg-blue-500/20 text-blue-700'
                                  : permission.type === 'terlambat'
                                  ? 'bg-amber-500/20 text-amber-700'
                                  : 'bg-secondary text-muted-foreground'
                              }`}
                            >
                              {PERMISSION_TYPE_LABELS[permission.type]}
                            </span>
                            {permission.reason && (
                              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{permission.reason}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {checkIn && (
                            <button
                              onClick={() => setLightbox({ url: checkIn.photoUrl, title: `${student.name} - Datang` })}
                              className="overflow-hidden rounded-full border border-border"
                              title="Lihat foto datang"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={checkIn.photoUrl} alt="Foto datang" className="h-10 w-10 object-cover" />
                            </button>
                          )}
                          {checkOut && (
                            <button
                              onClick={() => setLightbox({ url: checkOut.photoUrl, title: `${student.name} - Pulang` })}
                              className="overflow-hidden rounded-full border border-border"
                              title="Lihat foto pulang"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={checkOut.photoUrl} alt="Foto pulang" className="h-10 w-10 object-cover" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        {!checkIn && !checkOut ? null : confirmingStudentId === student.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-destructive">Hapus presensi ini?</span>
                            <button
                              onClick={() => handleDelete(checkIn, checkOut)}
                              disabled={deleting}
                              className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              onClick={() => setConfirmingStudentId(null)}
                              disabled={deleting}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingStudentId(student.id)}
                            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                            title="Hapus presensi hari ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] rounded-lg bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-2 top-2 rounded-full bg-secondary p-2 hover:bg-secondary/80"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.title} className="max-h-[70vh] w-auto object-contain" />
            <p className="mt-3 flex items-center justify-center gap-1 text-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" /> {lightbox.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
