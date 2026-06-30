export type UserRole = 'student' | 'supervisor';

export interface Milestone {
  weekNumber: number;
  title: string;
  description: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: 'image' | 'video';
  mimeType: string;
  data: string; // base64 encoded
  size: number; // in bytes
  uploadedAt: string;
}

export interface TimelineEntry {
  id: string;
  studentId: string;
  weekNumber: number;
  milestone?: string;
  accomplishment: string;
  blockers: string;
  nextWeek: string;
  attachments: Attachment[];
  supervisorFeedback?: string;
  feedbackDate?: string;
  status: 'pending' | 'reviewed' | 'approved';
  editCount: number;
  lastUpdated: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  password: string;
  studentId: string;
  team?: string;
  role: 'student';
}

export interface Supervisor {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'supervisor';
}

export interface TrackerState {
  students: Student[];
  supervisors: Supervisor[];
  timelineEntries: TimelineEntry[];
  currentUser: Student | Supervisor | null;
  selectedStudent: string | null;
  selectedWeek: number;
}
