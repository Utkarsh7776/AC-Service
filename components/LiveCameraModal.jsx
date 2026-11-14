'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, FlipHorizontal, AlertCircle, Check } from 'lucide-react';

export default function LiveCameraModal({ isOpen, onClose, onCapture, title = 'Capture Photo' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back camera, 'user' = selfie
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);

  // Stop camera stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing) => {
    stopStream();
    setLoading(true);
    setError('');
    setCapturedBlob(null);
    setCapturedPreview(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Live camera is not supported on this browser. Please use the standard photo upload button.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLoading(false);
    } catch (err) {
      console.error('Camera access error:', err);
      let msg = 'Could not access the camera. Please ensure camera permissions are allowed in your browser settings.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      }
      setError(msg);
      setLoading(false);
    }
  }, [stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedBlob(null);
      setCapturedPreview(null);
      setError('');
    }
    return () => stopStream();
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Flip between front and back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Take photo snapshot
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setCapturedBlob(blob);
          setCapturedPreview(previewUrl);
          stopStream();
        }
      },
      'image/jpeg',
      0.88
    );
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedBlob(null);
    setCapturedPreview(null);
    startCamera(facingMode);
  };

  // Accept and use photo
  const handleUsePhoto = () => {
    if (!capturedBlob) return;
    const fileName = `ac_photo_${Date.now()}.jpg`;
    const file = new File([capturedBlob], fileName, { type: 'image/jpeg' });
    onCapture(file);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between animate-fade-in text-white p-3 sm:p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-white">{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
          aria-label="Close camera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewfinder / Preview */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-black border border-white/10 my-2">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-20">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-xs text-slate-300">Initializing camera...</p>
          </div>
        )}

        {error ? (
          <div className="p-6 text-center max-w-sm">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-xs text-slate-200 leading-relaxed mb-4">{error}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="btn-primary py-2 px-4 text-xs font-semibold"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white underline py-1"
              >
                Cancel & Use Native Phone Uploader
              </button>
            </div>
          </div>
        ) : capturedPreview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={capturedPreview}
            alt="Captured proof"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Viewfinder crosshairs guide when live */}
        {!error && !loading && !capturedPreview && (
          <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-l-2 border-sky-400 absolute top-0 left-0"></div>
            <div className="w-8 h-8 border-t-2 border-r-2 border-sky-400 absolute top-0 right-0"></div>
            <div className="w-8 h-8 border-b-2 border-l-2 border-sky-400 absolute bottom-0 left-0"></div>
            <div className="w-8 h-8 border-b-2 border-r-2 border-sky-400 absolute bottom-0 right-0"></div>
            <span className="text-[11px] text-white/60 bg-black/40 px-2 py-0.5 rounded-full">
              Align AC unit in frame
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="py-3 flex items-center justify-around z-10">
        {capturedPreview ? (
          <div className="flex items-center gap-4 w-full max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </button>
            <button
              type="button"
              onClick={handleUsePhoto}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              Use This Photo
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full max-w-xs mx-auto">
            {/* Flip camera button */}
            <button
              type="button"
              onClick={toggleFacingMode}
              disabled={loading || Boolean(error)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 disabled:opacity-30"
              title="Flip Camera (Front/Back)"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>

            {/* Shutter button */}
            <button
              type="button"
              onClick={takeSnapshot}
              disabled={loading || Boolean(error)}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-90 transition disabled:opacity-40 shadow-xl"
              aria-label="Take snapshot"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-inner"></div>
            </button>

            {/* Empty placeholder for symmetry */}
            <div className="w-11"></div>
          </div>
        )}
      </div>
    </div>
  );
}
