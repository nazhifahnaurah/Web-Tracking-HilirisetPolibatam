'use client';

import { useState } from 'react';
import { Attachment } from '@/lib/types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface AttachmentViewerProps {
  attachments: Attachment[];
}

export function AttachmentViewer({ attachments }: AttachmentViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedAttachment = selectedIndex !== null ? attachments[selectedIndex] : null;

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === null ? null : prev === 0 ? attachments.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === null ? null : prev === attachments.length - 1 ? 0 : prev + 1));
  };

  if (attachments.length === 0) return null;

  return (
    <>
      {/* Thumbnail Gallery */}
      <div className="mt-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">ATTACHMENTS ({attachments.length})</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {attachments.map((attachment, index) => (
            <button
              key={attachment.id}
              onClick={() => setSelectedIndex(index)}
              className="group relative overflow-hidden rounded-lg border border-border bg-secondary transition-transform hover:scale-105"
            >
              {attachment.fileType === 'image' ? (
                <img
                  src={attachment.data}
                  alt={attachment.fileName}
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center bg-secondary/70">
                  <div className="text-center">
                    <div className="text-2xl">🎥</div>
                    <p className="mt-1 text-xs text-muted-foreground">Video</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs font-medium text-white">View</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] rounded-lg bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute right-2 top-2 rounded-full bg-secondary p-2 hover:bg-secondary/80"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>

            {/* Content */}
            {selectedAttachment.fileType === 'image' ? (
              <img
                src={selectedAttachment.data}
                alt={selectedAttachment.fileName}
                className="max-h-[70vh] w-auto object-contain"
              />
            ) : (
              <video
                src={selectedAttachment.data}
                controls
                className="max-h-[70vh] w-auto"
                autoPlay
              />
            )}

            {/* Navigation */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handlePrevious}
                className="rounded-full bg-secondary p-2 hover:bg-secondary/80"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>

              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{selectedAttachment.fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedIndex !== null && `${selectedIndex + 1} of ${attachments.length}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedAttachment.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                onClick={handleNext}
                className="rounded-full bg-secondary p-2 hover:bg-secondary/80"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
