# Robotics Tracker - Weekly Progress & Supervision Dashboard

A professional, modern web application for tracking robotics student progress over a 14-week project cycle. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS with a corporate dark theme design system.

## Features

### For Students
- **Weekly Progress Tracking**: Submit accomplishments, blockers, and next week plans for each of 14 weeks
- **Milestone Management**: Track progress against predefined project milestones
- **Progress Dashboard**: Visual overview of submission status and feedback
- **CSV Export**: Download all weekly entries as CSV for record-keeping
- **Quick Stats**: See submission progress and approval status at a glance
- **Week Navigation**: Easily navigate between weeks with visual milestone indicators

### For Supervisors
- **Multi-Student Overview**: Review progress from all assigned students
- **Submission Review**: Detailed view of student accomplishments, blockers, and plans
- **Feedback System**: Add structured feedback and comments on submissions
- **Approval Workflow**: Review and approve student submissions with status tracking
- **Student Selection**: Quick student switcher for efficient review workflow

### Core Features
- **Professional Corporate Design**: Dark theme with navy/blue color palette
- **Responsive Layout**: Optimized for desktop and tablet viewing
- **Dual Role Support**: Seamless switching between student and supervisor roles
- **Data Persistence**: All data stored in localStorage (can be extended to backend)
- **Form Validation**: Built-in validation for all submission fields
- **14-Week Curriculum**: Pre-configured milestones for robotics project cycle

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **React**: 19.2.4 with hooks
- **Styling**: Tailwind CSS 4
- **Icons**: lucide-react
- **State Management**: React Context + localStorage
- **Components**: Custom modular React components

## Project Structure

```
├── app/
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main page component
│   └── globals.css        # Global styles and design tokens
├── components/
│   ├── Header.tsx         # Top navigation and user switcher
│   ├── WeekPicker.tsx     # Week selection and navigation
│   ├── TimelineForm.tsx   # Student submission form
│   ├── TimelineView.tsx   # Progress timeline visualization
│   ├── StudentInterface.tsx    # Student dashboard
│   └── SupervisorInterface.tsx  # Supervisor dashboard
├── lib/
│   ├── types.ts           # TypeScript types and interfaces
│   └── useTrackerData.ts  # Custom hook for data management
└── public/                # Static assets
```

## Design System

### Color Palette
- **Background**: `#0a0f1a` - Deep navy
- **Card/Secondary**: `#121829`, `#1e293b` - Dark blues
- **Primary**: `#3b82f6` - Professional blue
- **Accent**: `#60a5fa` - Light blue
- **Text**: `#e8ecf3` - Off-white
- **Muted**: `#94a3b8` - Gray

### Typography
- **Font**: Geist (sans-serif)
- **Headings**: Bold, semantic sizing
- **Body**: Regular weight, 14-16px

## Getting Started

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### First Time Setup

1. Open the tracker - it loads with default sample data
2. Students are pre-loaded: Ahmad Rizki, Siti Nurhaliza, Budi Santoso
3. Supervisors are pre-loaded: Dr. Rahman, Prof. Indah
4. Switch between roles using the dropdown in the header

## User Flows

### Student Flow
1. **Login** → Select your name from dropdown
2. **View Week** → Select week number from picker or milestone list
3. **Submit Entry** → Fill in accomplishments, blockers, and plans
4. **Track Progress** → View all submissions and approval status
5. **Export Data** → Download CSV of all entries

### Supervisor Flow
1. **Login** → Select supervisor name from dropdown
2. **Select Student** → Choose student from the left panel
3. **Review Week** → Navigate through student submissions by week
4. **Add Feedback** → Write constructive feedback on submissions
5. **Approve** → Approve submission when ready

## Data Model

### TimelineEntry
```typescript
{
  id: string
  studentId: string
  weekNumber: number
  accomplishment: string
  blockers: string
  nextWeek: string
  supervisorFeedback?: string
  feedbackDate?: string
  status: 'pending' | 'reviewed' | 'approved'
  lastUpdated: string
}
```

### Student
```typescript
{
  id: string
  name: string
  email: string
  studentId: string
  team?: string
  role: 'student'
}
```

### Supervisor
```typescript
{
  id: string
  name: string
  email: string
  role: 'supervisor'
}
```

## Milestones (14 Weeks)

1. **Week 1**: Project Kickoff - Project setup and planning
2. **Week 2**: Initial Design - Design phase and prototyping
3. **Week 3**: Prototype v1 - First prototype completion
4. **Week 4**: Testing Phase - Initial testing and feedback
5. **Week 5**: Refinement - Design refinement
6. **Week 6**: Mid-point Review - Project mid-point assessment
7. **Week 7**: Integration - System integration
8. **Week 8**: Testing v2 - Comprehensive testing
9. **Week 9**: Optimization - Performance optimization
10. **Week 10**: Documentation - Documentation development
11. **Week 11**: Final Testing - Final round of testing
12. **Week 12**: Pre-Demo Prep - Preparation for demo
13. **Week 13**: Demo Preparation - Final demo preparations
14. **Week 14**: Project Completion - Final deliverables

## Key Components

### Header Component
- Displays current user with role badge
- Student/Supervisor selector dropdown
- Branded "RT" logo and title

### WeekPicker Component
- Previous/Next week navigation
- Week selector with expanded view
- Milestone title display
- Disabled navigation at week boundaries

### TimelineForm Component
- Three textarea inputs for student entries
- Real-time form validation
- Error messaging
- Distinguishes between create and edit modes

### TimelineView Component
- Status statistics (Submitted, Reviewed, Approved)
- Sortable timeline with status indicators
- Date tracking for each submission

### StudentInterface Component
- Quick stats with submission progress bar
- Milestone navigation sidebar
- Export to CSV functionality
- Recent activity display

### SupervisorInterface Component
- Student selection panel
- Detailed submission review
- Feedback composition area
- Approval workflow

## Customization

### Adding New Milestones
Edit the `MILESTONES` array in `lib/useTrackerData.ts`:

```typescript
const MILESTONES = [
  { weekNumber: 1, title: 'Your Milestone', description: 'Description' },
  // ...
]
```

### Changing Colors
Edit design tokens in `app/globals.css`:

```css
:root {
  --background: #your-color;
  --primary: #your-color;
  /* ... more colors */
}
```

### Adding Students/Supervisors
Edit the default data in `useTrackerData()`:

```typescript
const defaultStudents: Student[] = [
  { id: '4', name: 'New Student', email: 'email@example.com', ... },
]
```

## Features to Implement

- **Backend Integration**: Connect to PostgreSQL/MongoDB for persistent storage
- **Authentication**: Add user login with Better Auth
- **Email Notifications**: Notify supervisors of new submissions
- **Analytics Dashboard**: Progress graphs and completion rates
- **Bulk Export**: Export all student data for semester review
- **Comments System**: Add threaded comments on submissions
- **File Uploads**: Allow students to attach documents/images
- **Mobile App**: Native mobile experience

## Performance Optimizations

- Client-side rendering with lazy loading
- Tailwind CSS for minimal CSS output
- Component code splitting
- localStorage for instant data access
- Memoized hooks and callbacks

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliant
- Screen reader friendly forms

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

## License

Built with Vercel v0.

## Support

For issues or feature requests, please open an issue in the repository.
