'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrackerState, Student, Supervisor, TimelineEntry } from './types';
import { supabase } from './supabase';

const DEFAULT_STUDENTS: Student[] = [
  { id: '1', name: 'Abdul Hamid',           email: 'abdul',      password: 'abdul123',      studentId: 'STU001', team: 'ULV Drone', role: 'student' },
  { id: '2', name: 'Divo Setiawan',          email: 'divo',       password: 'divo123',       studentId: 'STU002', team: 'ULV Drone', role: 'student' },
  { id: '3', name: 'Rendy Androleo Rizaldy', email: 'rendy',      password: 'rendy123',      studentId: 'STU003', team: 'ULV Drone', role: 'student' },
  { id: '4', name: 'Asri',                   email: 'asri',       password: 'asri123',       studentId: 'STU004', team: 'ULV Drone', role: 'student' },
  { id: '5', name: 'Boby',                   email: 'boby',       password: 'boby123',       studentId: 'STU005', team: 'ULV Drone', role: 'student' },
  { id: '6', name: 'Tegar',                  email: 'tegar',      password: 'tegar123',      studentId: 'STU006', team: 'ULV Drone', role: 'student' },
];

const DEFAULT_SUPERVISORS: Supervisor[] = [
  { id: 'sup1', name: 'Supervisor', email: 'supervisor', password: 'supervisor123', role: 'supervisor' },
];

const SESSION_KEY = 'tracker_session';

function rowToEntry(row: any): TimelineEntry {
  return {
    id:                 row.id,
    studentId:          row.student_id,
    weekNumber:         row.week_number,
    accomplishment:     row.accomplishment,
    blockers:           row.blockers,
    nextWeek:           row.next_week,
    attachments:        row.attachments ?? [],
    supervisorFeedback: row.supervisor_feedback ?? undefined,
    feedbackDate:       row.feedback_date ?? undefined,
    status:             row.status,
    editCount:          row.edit_count,
    lastUpdated:        row.last_updated,
    milestone:          row.milestone ?? undefined,
  };
}

function entryToRow(e: TimelineEntry) {
  return {
    id:                  e.id,
    student_id:          e.studentId,
    week_number:         e.weekNumber,
    accomplishment:      e.accomplishment,
    blockers:            e.blockers,
    next_week:           e.nextWeek,
    attachments:         e.attachments,
    supervisor_feedback: e.supervisorFeedback ?? null,
    feedback_date:       e.feedbackDate ?? null,
    status:              e.status,
    edit_count:          e.editCount,
    last_updated:        e.lastUpdated,
    milestone:           e.milestone ?? null,
  };
}

export function useTrackerData() {
  const [currentUser, setCurrentUserState] = useState<Student | Supervisor | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore login session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setCurrentUserState(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Load all entries from Supabase on mount
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('timeline_entries')
        .select('*')
        .order('week_number', { ascending: true });
      if (!error && data) setTimelineEntries(data.map(rowToEntry));
      setIsLoading(false);
    })();
  }, []);

  // Real-time: auto-sync when any browser changes data
  useEffect(() => {
    const refetch = () =>
      supabase
        .from('timeline_entries')
        .select('*')
        .order('week_number', { ascending: true })
        .then(({ data }) => { if (data) setTimelineEntries(data.map(rowToEntry)); });

    const channel = supabase
      .channel('timeline_entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_entries' }, refetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const user =
      DEFAULT_STUDENTS.find(s => s.email === email && s.password === password) ??
      DEFAULT_SUPERVISORS.find(s => s.email === email && s.password === password) ??
      null;
    if (user) {
      setCurrentUserState(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUserState(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const addTimelineEntry = useCallback(async (entry: TimelineEntry) => {
    const { data, error } = await supabase
      .from('timeline_entries')
      .upsert(entryToRow(entry), { onConflict: 'id' })
      .select()
      .single();
    if (!error && data) {
      const saved = rowToEntry(data);
      setTimelineEntries(prev => {
        const idx = prev.findIndex(
          e => e.studentId === entry.studentId && e.weekNumber === entry.weekNumber
        );
        return idx >= 0 ? prev.map((e, i) => (i === idx ? saved : e)) : [...prev, saved];
      });
    }
  }, []);

  const updateTimelineEntry = useCallback(async (id: string, updates: Partial<TimelineEntry>) => {
    const existing = timelineEntries.find(e => e.id === id);
    if (!existing) return;
    const merged: TimelineEntry = { ...existing, ...updates, lastUpdated: new Date().toISOString() };
    const { data, error } = await supabase
      .from('timeline_entries')
      .update(entryToRow(merged))
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      setTimelineEntries(prev => prev.map(e => (e.id === id ? rowToEntry(data) : e)));
    }
  }, [timelineEntries]);

  const deleteTimelineEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('timeline_entries').delete().eq('id', id);
    if (!error) setTimelineEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const getStudentEntries = useCallback((studentId: string) =>
    timelineEntries
      .filter(e => e.studentId === studentId)
      .sort((a, b) => a.weekNumber - b.weekNumber),
  [timelineEntries]);

  const getWeekData = useCallback((studentId: string, weekNumber: number) =>
    timelineEntries.find(e => e.studentId === studentId && e.weekNumber === weekNumber),
  [timelineEntries]);

  const state: TrackerState = {
    students:        DEFAULT_STUDENTS,
    supervisors:     DEFAULT_SUPERVISORS,
    timelineEntries,
    currentUser,
    selectedStudent: null,
    selectedWeek:    1,
  };

  return {
    state,
    isLoading,
    login,
    logout,
    addTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
    getStudentEntries,
    getWeekData,
  };
}
