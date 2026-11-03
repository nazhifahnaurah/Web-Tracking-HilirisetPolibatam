'use client';

import { useCallback } from 'react';
import { supabase } from './supabase';
import { PermissionRecord, PermissionType, permissionRequiresReason } from './permission';

function rowToPermission(row: any): PermissionRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    type: row.type,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export function usePermissions() {
  const submitPermission = useCallback(
    async (params: {
      studentId: string;
      date: string;
      type: PermissionType;
      reason: string;
    }): Promise<{ error?: string; record?: PermissionRecord }> => {
      if (permissionRequiresReason(params.type) && !params.reason.trim()) {
        return { error: 'Keterangan wajib diisi untuk jenis izin ini.' };
      }

      const { data, error } = await supabase
        .from('attendance_permissions')
        .upsert(
          {
            student_id: params.studentId,
            date: params.date,
            type: params.type,
            reason: params.type === 'sakit' ? null : params.reason.trim(),
          },
          { onConflict: 'student_id,date' }
        )
        .select()
        .single();

      if (error) return { error: error.message };
      return { record: rowToPermission(data) };
    },
    []
  );

  const fetchPermissionForDate = useCallback(
    async (studentId: string, date: string): Promise<PermissionRecord | null> => {
      const { data, error } = await supabase
        .from('attendance_permissions')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', date)
        .maybeSingle();
      if (error || !data) return null;
      return rowToPermission(data);
    },
    []
  );

  const fetchPermissionsForDateAll = useCallback(async (date: string): Promise<PermissionRecord[]> => {
    const { data, error } = await supabase.from('attendance_permissions').select('*').eq('date', date);
    if (error || !data) return [];
    return data.map(rowToPermission);
  }, []);

  return {
    submitPermission,
    fetchPermissionForDate,
    fetchPermissionsForDateAll,
  };
}
