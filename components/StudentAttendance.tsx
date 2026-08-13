'use client';

import { useEffect, useMemo, useState } from 'react';
import { Student } from '@/lib/types';
import { useAttendance } from '@/lib/useAttendance';
import { AttendanceCamera } from './AttendanceCamera';
import {
  AttendanceRecord,
  AttendanceType,
  CAMPUS_LOCATION,
  MAX_DISTANCE_METERS,
  checkInStatus,
  distanceInMeters,
  formatWindowLabel,
  isWithinAttendanceWindow,
  isWorkday,
  todayDateString,
} from '@/lib/attendance';
import { CheckCircle2, Clock, MapPin, XCircle, Loader2 } from 'lucide-react';

interface StudentAttendanceProps {
  student: Student;
}

type Phase = 'idle' | 'locating' | 'too-far' | 'camera' | 'uploading' | 'result';

export function StudentAttendance({ student }: StudentAttendanceProps) {
  const { submitAttendance, fetchRecordsForDate, fetchRecordsForStudentRange } = useAttendance();

  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);

  const [activeType, setActiveType] = useState<AttendanceType | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resultOk, setResultOk] = useState(false);

  const today = todayDateString();
  const workday = isWorkday();
  const withinWindow = isWithinAttendanceWindow();

  const checkIn = todayRecords.find((r) => r.type === 'check_in');
  const checkOut = todayRecords.find((r) => r.type === 'check_out');

  const monthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => todayDateString(d);
    return { start: fmt(start), end: fmt(end) };
  }, []);

  const loadToday = async () => {
    setLoadingToday(true);
    const records = await fetchRecordsForDate(student.id, today);
    setTodayRecords(records);
    setLoadingToday(false);
  };

  const loadHistory = async () => {
    const records = await fetchRecordsForStudentRange(student.id, monthRange.start, monthRange.end);
    setHistory(records);
  };

  useEffect(() => {
    loadToday();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  const resetFlow = () => {
    setActiveType(null);
    setPhase('idle');
    setStatusMessage(null);
    setDistance(null);
    setCoords(null);
  };

  const startAttendance = (type: AttendanceType) => {
    if (!workday) {
      setStatusMessage('Presensi hanya bisa dilakukan hari Senin sampai Jumat.');
      return;
    }
    if (!withinWindow) {
      setStatusMessage(`Presensi hanya bisa dilakukan pukul ${formatWindowLabel()}.`);
      return;
    }
    setActiveType(type);
    setStatusMessage(null);
    setPhase('locating');

    if (!navigator.geolocation) {
      setStatusMessage('Perangkat/browser ini tidak mendukung deteksi lokasi.');
      setPhase('idle');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const dist = distanceInMeters(lat, lng, CAMPUS_LOCATION.lat, CAMPUS_LOCATION.lng);
        setCoords({ lat, lng });
        setDistance(dist);
        if (dist > MAX_DISTANCE_METERS) {
          setPhase('too-far');
        } else {
          setPhase('camera');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatusMessage('Izin lokasi ditolak. Aktifkan izin lokasi di browser untuk melakukan presensi.');
        } else {
          setStatusMessage('Gagal mendapatkan lokasi. Pastikan GPS aktif dan coba lagi.');
        }
        setPhase('idle');
        setActiveType(null);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleCapture = async (file: File) => {
    if (!activeType || !coords || distance === null) return;
    setPhase('uploading');
    const status = activeType === 'check_in' ? checkInStatus() : null;
    const { error } = await submitAttendance({
      studentId: student.id,
      type: activeType,
      photoFile: file,
      latitude: coords.lat,
      longitude: coords.lng,
      distanceMeters: distance,
      status,
    });

    if (error) {
      setStatusMessage(error);
      setResultOk(false);
    } else {
      setStatusMessage(
        activeType === 'check_in'
          ? status === 'tepat_waktu'
            ? 'Presensi datang berhasil, tepat waktu.'
            : 'Presensi datang berhasil, tercatat terlambat.'
          : 'Presensi pulang berhasil.'
      );
      setResultOk(true);
      await loadToday();
      await loadHistory();
    }
    setPhase('result');
  };

  const renderStatusCard = (type: AttendanceType, record: AttendanceRecord | undefined) => {
    const label = type === 'check_in' ? 'Presensi Datang' : 'Presensi Pulang';
    if (record) {
      return (
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-foreground">{label} sudah tercatat</p>
              <p className="text-sm text-muted-foreground">
                {new Date(record.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                {record.status && (
                  <span className={record.status === 'terlambat' ? 'ml-2 text-amber-600' : 'ml-2 text-green-600'}>
                    · {record.status === 'terlambat' ? 'Terlambat' : 'Tepat Waktu'}
                  </span>
                )}
              </p>
            </div>
          </div>
          {record.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={record.photoUrl} alt={label} className="h-12 w-12 rounded-full object-cover" />
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-muted-foreground" />
          <p className="font-medium text-foreground">{label} belum dilakukan</p>
        </div>
        {(type === 'check_in' || checkIn) && (
          <button
            onClick={() => startAttendance(type)}
            disabled={activeType !== null && phase !== 'idle'}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {label}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Presensi Harian</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jam kerja: {formatWindowLabel()} · Senin - Jumat · Lokasi wajib di area Politeknik Negeri Batam
        </p>
      </div>

      {!workday && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
          Hari ini bukan hari kerja (Senin-Jumat), presensi tidak tersedia.
        </div>
      )}

      {!loadingToday && (
        <div className="space-y-3">
          {renderStatusCard('check_in', checkIn)}
          {checkIn && renderStatusCard('check_out', checkOut)}
        </div>
      )}

      {phase !== 'idle' && activeType && (
        <div className="rounded-lg border border-border bg-card p-6">
          {phase === 'locating' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Mendeteksi lokasi Anda...</p>
            </div>
          )}

          {phase === 'too-far' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-foreground">Anda berada di luar area kampus</p>
              <p className="text-sm text-muted-foreground">
                Jarak Anda sekitar {Math.round(distance ?? 0)} meter dari kampus (maksimal {MAX_DISTANCE_METERS} meter).
              </p>
              <div className="flex gap-2">
                <button
                  onClick={resetFlow}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={() => startAttendance(activeType)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {phase === 'camera' && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-green-600">
                <MapPin className="h-4 w-4" />
                Lokasi terverifikasi ({Math.round(distance ?? 0)} m dari kampus). Ambil foto wajah untuk menyelesaikan presensi.
              </p>
              <AttendanceCamera onCapture={handleCapture} />
              <button onClick={resetFlow} className="text-sm text-muted-foreground hover:text-foreground">
                Batal
              </button>
            </div>
          )}

          {phase === 'uploading' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Mengirim presensi...</p>
            </div>
          )}

          {phase === 'result' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              {resultOk ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
              <p className="text-sm text-foreground">{statusMessage}</p>
              <button
                onClick={resetFlow}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      )}

      {statusMessage && phase === 'idle' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {statusMessage}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold text-foreground">Riwayat Presensi Bulan Ini</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada riwayat presensi bulan ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Tanggal</th>
                  <th className="py-2 pr-4 font-medium">Datang</th>
                  <th className="py-2 pr-4 font-medium">Pulang</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(history.map((h) => h.date))).map((date) => {
                  const dayIn = history.find((h) => h.date === date && h.type === 'check_in');
                  const dayOut = history.find((h) => h.date === date && h.type === 'check_out');
                  const fmtTime = (r?: AttendanceRecord) =>
                    r ? new Date(r.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                  return (
                    <tr key={date} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-foreground">
                        {new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2 pr-4 text-foreground">{fmtTime(dayIn)}</td>
                      <td className="py-2 pr-4 text-foreground">{fmtTime(dayOut)}</td>
                      <td className="py-2">
                        {dayIn?.status === 'terlambat' ? (
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Terlambat
                          </span>
                        ) : (
                          <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-700">
                            Tepat Waktu
                          </span>
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
    </div>
  );
}
