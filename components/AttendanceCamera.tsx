'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Check, AlertTriangle } from 'lucide-react';

interface AttendanceCameraProps {
  onCapture: (file: File) => void;
}

/**
 * Kamera langsung (getUserMedia) untuk foto presensi — tidak ada opsi upload dari
 * galeri sama sekali, hanya jepretan kamera depan secara langsung.
 */
export function AttendanceCamera({ onCapture }: AttendanceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  // React StrictMode (dev) double-invokes effects, which would otherwise start two
  // overlapping getUserMedia calls and abort each other's video.play(). This token
  // lets a stale call detect it's been superseded and quietly back off instead of
  // surfacing a spurious "can't access camera" error.
  const requestIdRef = useRef(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);
    setIsStarting(true);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      if (requestId !== requestIdRef.current) {
        // A newer startCamera() call (or unmount) superseded this one.
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          if (!(playErr instanceof DOMException && playErr.name === 'AbortError')) throw playErr;
        }
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return; // stale call, ignore
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Aktifkan izin kamera untuk browser ini di pengaturan HP/browser, lalu coba lagi.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan di perangkat ini.');
      } else {
        setError('Tidak bisa mengakses kamera. Pastikan browser mengizinkan akses kamera.');
      }
    } finally {
      if (requestId === requestIdRef.current) setIsStarting(false);
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      requestIdRef.current++; // invalidate any in-flight getUserMedia/play() call
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShoot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `presensi-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setPreviewFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      stopStream();
    }, 'image/jpeg', 0.85);
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (previewFile) onCapture(previewFile);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={startCamera}
          className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-lg border border-border bg-black">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Pratinjau foto presensi" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover [transform:scaleX(-1)]"
          />
        )}
        {isStarting && !previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
            Membuka kamera...
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {previewUrl ? (
        <div className="flex gap-2">
          <button
            onClick={handleRetake}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80"
          >
            <RotateCcw className="h-4 w-4" />
            Ambil Ulang
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Check className="h-4 w-4" />
            Gunakan Foto Ini
          </button>
        </div>
      ) : (
        <button
          onClick={handleShoot}
          disabled={isStarting}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="h-5 w-5" />
          Ambil Foto
        </button>
      )}
    </div>
  );
}
