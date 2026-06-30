'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { LoginPage } from '@/components/LoginPage';
import { WeekPicker } from '@/components/WeekPicker';
import { StudentInterface } from '@/components/StudentInterface';
import { SupervisorInterface } from '@/components/SupervisorInterface';
import { useTrackerData } from '@/lib/useTrackerData';

export default function Page() {
  const {
    state,
    isLoading,
    login,
    logout,
    getWeekData,
    updateTimelineEntry,
    addTimelineEntry,
    deleteTimelineEntry,
    getStudentEntries,
  } = useTrackerData();

  const [weekNumber, setWeekNumber] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (state.currentUser?.role === 'supervisor' && state.students.length > 0 && !selectedStudent) {
      setSelectedStudent(state.students[0].id);
    }
  }, [state.students, state.currentUser, selectedStudent]);

  const handleLogout = () => {
    logout();
    setWeekNumber(1);
    setSelectedStudent(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading tracker...</p>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return <LoginPage onLogin={login} />;
  }

  const isStudent = state.currentUser.role === 'student';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentUser={state.currentUser} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <WeekPicker currentWeek={weekNumber} onWeekChange={setWeekNumber} />
        <div className="mt-6">
          {isStudent ? (
            <StudentInterface
              student={state.currentUser as any}
              weekNumber={weekNumber}
              onWeekChange={setWeekNumber}
              getStudentEntries={getStudentEntries}
              getWeekData={getWeekData}
              addTimelineEntry={addTimelineEntry}
              deleteTimelineEntry={deleteTimelineEntry}
            />
          ) : (
            <SupervisorInterface
              supervisor={state.currentUser as any}
              students={state.students}
              selectedStudent={selectedStudent}
              weekNumber={weekNumber}
              onStudentChange={setSelectedStudent}
              onWeekChange={setWeekNumber}
              updateTimelineEntry={updateTimelineEntry}
              timelineEntries={state.timelineEntries}
            />
          )}
        </div>
      </main>
    </div>
  );
}
