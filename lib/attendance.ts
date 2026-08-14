export type AttendanceType = 'check_in' | 'check_out';
export type AttendanceStatus = 'tepat_waktu' | 'terlambat';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // 'YYYY-MM-DD'
  type: AttendanceType;
  recordedAt: string; // ISO timestamp
  photoUrl: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  status: AttendanceStatus | null;
}

// Politeknik Negeri Batam. This is the average of 3 live browser geolocation readings
// taken on-site (2026-08-13), cross-checked by pasting the coordinate into Google Maps
// and confirming the pin lands on campus — matches the original web search/OSM sourced
// value within ~50m. An earlier "on-site GPS reading" a user manually copied from a
// map pin turned out to be ~1.9km off (likely a mis-placed pin, not a real reading) —
// this value superseded it after verification. Trust readings verified against a map,
// not a single manually-copied number, if this ever needs correcting again.
export const CAMPUS_LOCATION = { lat: 1.1185156, lng: 104.0489578 };
export const MAX_DISTANCE_METERS = 150;

// Presensi hanya berlaku Senin–Jumat, bisa dilakukan jam berapa pun. Check-in setelah
// jam 10:00 tetap diterima tapi ditandai terlambat, dan total durasi kerja per hari
// diharapkan minimal 8 jam (kalau kurang, ditandai peringatan durasi).
export const ON_TIME_CUTOFF_MINUTES = 10 * 60; // 10:00
export const MIN_WORK_HOURS = 8;

export function todayDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isWorkday(d: Date = new Date()): boolean {
  const day = d.getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
  return day >= 1 && day <= 5;
}

export function minutesSinceMidnight(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function checkInStatus(d: Date = new Date()): AttendanceStatus {
  return minutesSinceMidnight(d) <= ON_TIME_CUTOFF_MINUTES ? 'tepat_waktu' : 'terlambat';
}

/** Durasi kerja dalam jam antara waktu check-in dan check-out. */
export function workDurationHours(checkInIso: string, checkOutIso: string): number {
  const ms = new Date(checkOutIso).getTime() - new Date(checkInIso).getTime();
  return ms / (1000 * 60 * 60);
}

export function formatDurationHours(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h} jam ${m} menit`;
}

/** Jarak antara dua koordinat GPS dalam meter (formula Haversine). */
export function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // radius bumi dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

