export type PermissionType = 'terlambat' | 'sakit' | 'lain_lain';

export interface PermissionRecord {
  id: string;
  studentId: string;
  date: string; // 'YYYY-MM-DD'
  type: PermissionType;
  reason: string | null;
  createdAt: string;
}

export const PERMISSION_TYPE_LABELS: Record<PermissionType, string> = {
  terlambat: 'Izin Terlambat',
  sakit: 'Izin Sakit',
  lain_lain: 'Izin Lain-lain',
};

export function permissionRequiresReason(type: PermissionType): boolean {
  return type === 'terlambat' || type === 'lain_lain';
}
