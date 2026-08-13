'use client';

import { useCallback } from 'react';
import { supabase } from './supabase';
import { AttendanceRecord, AttendanceStatus, AttendanceType, todayDateString } from './attendance';

const ATTENDANCE_BUCKET = 'attendance-photos';

function rowToRecord(row: any): AttendanceRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    type: row.type,
    recordedAt: row.recorded_at,
    photoUrl: row.photo_url,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceMeters: row.distance_meters,
    status: row.status ?? null,
  };
}

export function useAttendance() {
  const submitAttendance = useCallback(
    async (params: {
      studentId: string;
      type: AttendanceType;
      photoFile: File;
      latitude: number;
      longitude: number;
      distanceMeters: number;
      status: AttendanceStatus | null;
    }): Promise<{ error?: string; record?: AttendanceRecord }> => {
      const date = todayDateString();
      const path = `${params.studentId}/${date}/${params.type}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(ATTENDANCE_BUCKET)
        .upload(path, params.photoFile);
      if (uploadError) {
        return { error: `Gagal mengupload foto: ${uploadError.message}` };
      }

      const { data: urlData } = supabase.storage.from(ATTENDANCE_BUCKET).getPublicUrl(path);

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          student_id: params.studentId,
          date,
          type: params.type,
          photo_url: urlData.publicUrl,
          latitude: params.latitude,
          longitude: params.longitude,
          distance_meters: params.distanceMeters,
          status: params.status,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return {
            error:
              params.type === 'check_in'
                ? 'Anda sudah presensi datang hari ini.'
                : 'Anda sudah presensi pulang hari ini.',
          };
        }
        return { error: error.message };
      }

      return { record: rowToRecord(data) };
    },
    []
  );

  const fetchRecordsForDate = useCallback(async (studentId: string, date: string): Promise<AttendanceRecord[]> => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', date);
    if (error || !data) return [];
    return data.map(rowToRecord);
  }, []);

  const fetchRecordsForStudentRange = useCallback(
    async (studentId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      if (error || !data) return [];
      return data.map(rowToRecord);
    },
    []
  );

  const fetchRecordsForDateAll = useCallback(async (date: string): Promise<AttendanceRecord[]> => {
    const { data, error } = await supabase.from('attendance').select('*').eq('date', date);
    if (error || !data) return [];
    return data.map(rowToRecord);
  }, []);

  return { submitAttendance, fetchRecordsForDate, fetchRecordsForStudentRange, fetchRecordsForDateAll };
}
