# Web Tracking Polibatam

Platform web untuk memantau progres dan kendala mahasiswa dalam pengerjaan proyek **HILIRISET LPDP · Aerial ULV-Fogging dengan Kontrol Droplet Adaptif**. Dosen/supervisor dapat memantau perkembangan setiap mahasiswa secara real-time serta memberikan masukan dan solusi atas kendala yang dihadapi.

Dibangun dengan Next.js 16, React 19, TypeScript, dan Tailwind CSS.

## Fitur

### Untuk Mahasiswa
- Submit laporan mingguan: accomplishment, blockers, dan rencana minggu depan
- Lampiran gambar/video per submission
- Edit dan hapus entri yang sudah disubmit
- Navigasi minggu berbasis kalender (Juli 2026 – Desember 2028), dikelompokkan per tahun → bulan → minggu
- Export seluruh riwayat progres ke Excel (.xlsx), termasuk gambar lampiran yang di-embed langsung di file
- Statistik cepat: jumlah submission, status approved/reviewed/pending

### Untuk Supervisor
- Dashboard multi-mahasiswa
- Review detail submission per minggu
- Beri feedback dan approve submission
- Quick-jump ke minggu yang sudah disubmit per mahasiswa

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **UI**: React 19, Tailwind CSS 4, lucide-react
- **Export Excel**: ExcelJS (mendukung embed gambar)
- **Penyimpanan data**: localStorage (browser)

## Struktur Project

```
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── LoginPage.tsx
│   ├── WeekPicker.tsx
│   ├── TimelineForm.tsx
│   ├── TimelineView.tsx
│   ├── StudentInterface.tsx
│   ├── SupervisorInterface.tsx
│   └── AttachmentViewer.tsx
├── lib/
│   ├── types.ts
│   ├── weeks.ts            # generator minggu kalender Juli 2026–Des 2028
│   └── useTrackerData.ts   # hook state + localStorage
└── public/                 # logo & aset statis
```

## Menjalankan secara Lokal

```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Buka `http://localhost:3000`.

## Model Data

### TimelineEntry
```typescript
{
  id: string
  studentId: string
  weekNumber: number       // index minggu sekuensial (lihat lib/weeks.ts)
  accomplishment: string
  blockers: string
  nextWeek: string
  attachments: Attachment[]
  supervisorFeedback?: string
  feedbackDate?: string
  status: 'pending' | 'reviewed' | 'approved'
  editCount: number
  lastUpdated: string
}
```

### Student / Supervisor
```typescript
Student {
  id, name, email, password, studentId, team?, role: 'student'
}
Supervisor {
  id, name, email, password, role: 'supervisor'
}
```
