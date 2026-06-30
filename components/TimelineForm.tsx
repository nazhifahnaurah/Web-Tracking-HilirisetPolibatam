'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { TimelineEntry, Student, Attachment } from '@/lib/types';
import { Plus, X, Upload, Trash2, Image as ImageIcon, Film } from 'lucide-react';

export interface TimelineFormHandle {
  openForm: () => void;
}

interface TimelineFormProps {
  student: Student;
  weekNumber: number;
  existingEntry?: TimelineEntry;
  milestoneTitle?: string;
  onSubmit: (entry: TimelineEntry) => void;
  isReadOnly?: boolean;
}

export const TimelineForm = forwardRef<TimelineFormHandle, TimelineFormProps>(
function TimelineForm({
  student,
  weekNumber,
  existingEntry,
  milestoneTitle,
  onSubmit,
  isReadOnly = false,
}, ref) {
  const [formData, setFormData] = useState({
    accomplishment: existingEntry?.accomplishment || '',
    blockers: existingEntry?.blockers || '',
    nextWeek: existingEntry?.nextWeek || '',
  });
  const [attachments, setAttachments] = useState<Attachment[]>(existingEntry?.attachments || []);
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openForm: () => setIsOpen(true),
  }));
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadError, setUploadError] = useState<string>('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_FILES = 3;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.accomplishment.trim())
      newErrors.accomplishment = 'Accomplishments are required';
    if (!formData.blockers.trim())
      newErrors.blockers = 'Blockers field is required';
    if (!formData.nextWeek.trim())
      newErrors.nextWeek = 'Next week plans are required';
    if (attachments.length === 0)
      newErrors.attachments = 'At least one image or video is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    setUploadError('');

    if (attachments.length + files.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError('Only images and videos are allowed');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File "${file.name}" exceeds 5MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const fileType = file.type.startsWith('image') ? 'image' : 'video';
        const attachment: Attachment = {
          id: `${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileType,
          mimeType: file.type,
          data: base64,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const entry: TimelineEntry = {
      id: existingEntry?.id || `${student.id}-w${weekNumber}-${Date.now()}`,
      studentId: student.id,
      weekNumber,
      accomplishment: formData.accomplishment,
      blockers: formData.blockers,
      nextWeek: formData.nextWeek,
      attachments,
      milestone: milestoneTitle,
      status: 'pending',
      editCount: existingEntry ? existingEntry.editCount + 1 : 0,
      lastUpdated: new Date().toISOString(),
    };

    onSubmit(entry);
    setFormData({ accomplishment: '', blockers: '', nextWeek: '' });
    setAttachments([]);
    setIsOpen(false);
  };

  if (isReadOnly) {
    const canEdit = existingEntry && existingEntry.editCount === 0;
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">ACCOMPLISHMENTS</h3>
          <p className="mt-2 text-foreground">{existingEntry?.accomplishment || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">BLOCKERS</h3>
          <p className="mt-2 text-foreground">{existingEntry?.blockers || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">NEXT WEEK PLANS</h3>
          <p className="mt-2 text-foreground">{existingEntry?.nextWeek || '-'}</p>
        </div>
        {existingEntry?.supervisorFeedback && (
          <div className="mt-4 rounded-lg bg-secondary/50 p-3">
            <h3 className="text-sm font-semibold text-muted-foreground">SUPERVISOR FEEDBACK</h3>
            <p className="mt-2 text-foreground">{existingEntry.supervisorFeedback}</p>
            {existingEntry.feedbackDate && (
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(existingEntry.feedbackDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
        {canEdit && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full mt-4 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Edit Progress (1 time allowed)
          </button>
        )}
        {existingEntry && existingEntry.editCount > 0 && (
          <div className="mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
            <p className="text-xs text-yellow-700">Already edited. No further edits allowed.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {existingEntry && !isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full rounded-lg border border-primary bg-primary/10 p-4 text-left hover:bg-primary/20"
        >
          <p className="text-sm text-muted-foreground">Week {weekNumber} Entry</p>
          <p className="mt-1 font-medium text-foreground line-clamp-2">
            {existingEntry.accomplishment}
          </p>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">ACCOMPLISHMENTS</label>
            <textarea
              value={formData.accomplishment}
              onChange={(e) => setFormData({ ...formData, accomplishment: e.target.value })}
              placeholder="What did you accomplish this week?"
              className={`mt-2 w-full rounded-lg border ${
                errors.accomplishment ? 'border-destructive' : 'border-border'
              } bg-secondary px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              rows={3}
            />
            {errors.accomplishment && (
              <p className="mt-1 text-xs text-destructive">{errors.accomplishment}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground">BLOCKERS</label>
            <textarea
              value={formData.blockers}
              onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
              placeholder="What blockers did you encounter?"
              className={`mt-2 w-full rounded-lg border ${
                errors.blockers ? 'border-destructive' : 'border-border'
              } bg-secondary px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              rows={3}
            />
            {errors.blockers && (
              <p className="mt-1 text-xs text-destructive">{errors.blockers}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground">NEXT WEEK PLANS</label>
            <textarea
              value={formData.nextWeek}
              onChange={(e) => setFormData({ ...formData, nextWeek: e.target.value })}
              placeholder="What are your plans for next week?"
              className={`mt-2 w-full rounded-lg border ${
                errors.nextWeek ? 'border-destructive' : 'border-border'
              } bg-secondary px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              rows={3}
            />
            {errors.nextWeek && (
              <p className="mt-1 text-xs text-destructive">{errors.nextWeek}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground">
              ATTACHMENTS (Optional)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-primary/10');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-primary/10');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-primary/10');
                handleFileChange(e.dataTransfer.files);
              }}
              className="mt-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 p-6 text-center transition-colors"
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Drag files here or click to upload
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Images or videos, max 5MB each, up to 3 files
                </p>
              </label>
            </div>
            {uploadError && (
              <p className="mt-1 text-xs text-destructive">{uploadError}</p>
            )}

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {attachments.length} file(s) selected
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group relative overflow-hidden rounded-lg border border-border bg-secondary"
                    >
                      {attachment.fileType === 'image' ? (
                        <>
                          <img
                            src={attachment.data}
                            alt={attachment.fileName}
                            className="h-24 w-full object-cover"
                          />
                          <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground/50" />
                        </>
                      ) : (
                        <div className="flex h-24 items-center justify-center">
                          <Film className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </button>
                      <p className="truncate bg-secondary/50 px-2 py-1 text-xs text-muted-foreground">
                        {attachment.fileName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              {existingEntry ? 'Update Entry' : 'Submit Entry'}
            </button>
            {isOpen && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
});
