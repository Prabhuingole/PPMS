'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClockInOutModalProps {
  open: boolean;
  type: 'in' | 'out';
  onClose: () => void;
  onCapture: (file: File) => void;
  loading?: boolean;
}

export function ClockInOutModal({ open, type, onClose, onCapture, loading }: ClockInOutModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCaptured(null);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCaptured(null);
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      setCaptured(canvas.toDataURL('image/png'));
    }
  };

  const retake = () => {
    setCaptured(null);
    startCamera();
  };

  const confirm = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `clock_${type}_${Date.now()}.png`, { type: 'image/png' });
        onCapture(file);
      }
    }, 'image/png');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${type === 'in' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <Camera className={`h-5 w-5 ${type === 'in' ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Clock {type === 'in' ? 'In' : 'Out'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Capture your photo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Camera / Preview */}
        <div className="p-6">
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-[4/3]">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium p-6 text-center">
                {cameraError}
              </div>
            ) : captured ? (
              <img src={captured} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            {/* Overlay Guide */}
            {!captured && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 rounded-full border-2 border-dashed border-white/30" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {/* Timestamp */}
          <div className="mt-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {new Date().toLocaleString('en-IN', { 
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {captured ? (
            <>
              <Button 
                onClick={retake} 
                variant="outline" 
                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest"
                disabled={loading}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Retake
              </Button>
              <Button 
                onClick={confirm} 
                className={`flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest shadow-lg ${
                  type === 'in' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                } text-white`}
                disabled={loading}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Submitting...' : `Confirm Clock ${type === 'in' ? 'In' : 'Out'}`}
              </Button>
            </>
          ) : (
            <Button 
              onClick={takePhoto} 
              className={`w-full rounded-xl h-12 font-bold text-xs uppercase tracking-widest shadow-lg ${
                type === 'in' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
              } text-white`}
              disabled={!!cameraError}
            >
              <Camera className="mr-2 h-4 w-4" /> Capture Photo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
