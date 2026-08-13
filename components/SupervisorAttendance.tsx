'use client';

import { useEffect, useState } from 'react';
import { Student } from '@/lib/types';
import { useAttendance } from '@/lib/useAttendance';
import { AttendanceRecord, todayDateString } from '@/lib/attendance';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';

interface SupervisorAttendanceProps {
  students: Student[];
}

export function SupervisorAttendance({ students }: SupervisorAttendanceProps) {
  const { fetchRecordsForDateAll } = useAttendance();
  const [date, setDate] = useState(todayDateString());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchRecordsForDateAll(date).then((r) => {
      setRecords(r);
      setLoading(false);
    });
  }, [date, fetchRecordsForDateAll]);

  const shiftDate = (deltaDays: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + deltaDays);
    setDate(todayDateString(d));
  };

  const fmtTime = (r?: AttendanceRecord) =>
    r ? new Date(r.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Presensi Harian</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">Rekap Presensi Mahasiswa</h2>
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
                  <th className="py-2 font-medium">Foto</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const checkIn = records.find((r) => r.studentId === student.id && r.type === 'check_in');
                  const checkOut = records.find((r) => r.studentId === student.id && r.type === 'check_out');
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
                        ) : checkIn.status === 'terlambat' ? (
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
