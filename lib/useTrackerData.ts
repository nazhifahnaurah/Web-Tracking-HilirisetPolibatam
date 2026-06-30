'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrackerState, Student, Supervisor, TimelineEntry } from './types';

const STORAGE_KEY = 'tracker_data';

export function useTrackerData() {
  const [state, setState] = useState<TrackerState>({
    students: [],
    supervisors: [],
    timelineEntries: [],
    currentUser: null,
    selectedStudent: null,
    selectedWeek: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState(parsed);
      } catch (e) {
        console.error('Failed to load tracker data:', e);
        loadDefaultData();
      }
    } else {
      loadDefaultData();
    }
    setIsLoading(false);
  }, []);

  const loadDefaultData = useCallback(() => {
    const defaultStudents: Student[] = [
      { id: '1', name: 'Abdul Hamid', email: 'abdul', password: 'abdul123', studentId: 'STU001', team: 'ULV Drone', role: 'student' },
      { id: '2', name: 'Divo Setiawan', email: 'divo', password: 'divo123', studentId: 'STU002', team: 'ULV Drone', role: 'student' },
      { id: '3', name: 'Rendy Androleo Rizaldy', email: 'rendy', password: 'rendy123', studentId: 'STU003', team: 'ULV Drone', role: 'student' },
      { id: '4', name: 'Asri', email: 'asri', password: 'asri123', studentId: 'STU004', team: 'ULV Drone', role: 'student' },
      { id: '5', name: 'Boby', email: 'boby', password: 'boby123', studentId: 'STU005', team: 'ULV Drone', role: 'student' },
      { id: '6', name: 'Tegar', email: 'tegar', password: 'tegar123', studentId: 'STU006', team: 'ULV Drone', role: 'student' },
    ];

    const defaultSupervisors: Supervisor[] = [
      { id: 'sup1', name: 'Supervisor', email: 'supervisor', password: 'supervisor123', role: 'supervisor' },
    ];

    const newState: TrackerState = {
      students: defaultStudents,
      supervisors: defaultSupervisors,
      timelineEntries: [],
      currentUser: null,
      selectedStudent: null,
      selectedWeek: 1,
    };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const setCurrentUser = useCallback(
    (user: Student | Supervisor) => {
      setState((prev) => {
        const newState = { ...prev, currentUser: user };
        if (user.role === 'student') {
          newState.selectedStudent = (user as Student).id;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },
    []
  );

  const addTimelineEntry = useCallback(
    (entry: TimelineEntry) => {
      setState((prev) => {
        const existingIndex = prev.timelineEntries.findIndex(
          (e) => e.studentId === entry.studentId && e.weekNumber === entry.weekNumber
        );
        const newEntries =
          existingIndex >= 0
            ? prev.timelineEntries.map((e, i) => (i === existingIndex ? entry : e))
            : [...prev.timelineEntries, entry];
        const newState = { ...prev, timelineEntries: newEntries };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },
    []
  );

  const updateTimelineEntry = useCallback(
    (id: string, updates: Partial<TimelineEntry>) => {
      setState((prev) => {
        const newState = {
          ...prev,
          timelineEntries: prev.timelineEntries.map((e) =>
            e.id === id ? { ...e, ...updates, lastUpdated: new Date().toISOString() } : e
          ),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },
    []
  );

  const deleteTimelineEntry = useCallback(
    (id: string) => {
      setState((prev) => {
        const newState = {
          ...prev,
          timelineEntries: prev.timelineEntries.filter((e) => e.id !== id),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },
    []
  );

  const getStudentEntries = useCallback(
    (studentId: string) => {
      return state.timelineEntries.filter((e) => e.studentId === studentId).sort((a, b) => a.weekNumber - b.weekNumber);
    },
    [state.timelineEntries]
  );

  const getWeekData = useCallback(
    (studentId: string, weekNumber: number) => {
      return state.timelineEntries.find((e) => e.studentId === studentId && e.weekNumber === weekNumber);
    },
    [state.timelineEntries]
  );

  const login = useCallback(
    (email: string, password: string): boolean => {
      const student = state.students.find(
        (s) => s.email === email && s.password === password
      );
      const supervisor = state.supervisors.find(
        (s) => s.email === email && s.password === password
      );

      const user = student || supervisor;
      if (user) {
        setState((prev) => {
          const newState = {
            ...prev,
            currentUser: user,
            selectedStudent: student ? student.id : prev.selectedStudent,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
          return newState;
        });
        return true;
      }
      return false;
    },
    [state.students, state.supervisors]
  );

  const logout = useCallback(() => {
    setState((prev) => {
      const newState = {
        ...prev,
        currentUser: null,
        selectedStudent: null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  return {
    state,
    isLoading,
    setCurrentUser,
    addTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
    getStudentEntries,
    getWeekData,
    login,
    logout,
  };
}
