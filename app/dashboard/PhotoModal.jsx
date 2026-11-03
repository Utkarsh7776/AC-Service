'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

export default function PhotoModal({ src, label, visitId, type, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger (wraps the thumbnail) */}
      <button
        type="button"
        id={`photo-trigger-${visitId}-${type}`}
        onClick={() => setOpen(true)}
        className="w-full h-full block focus:outline-none focus:ring-2 focus:ring-brand-400 relative group/photo"
        aria-label={`View full-size ${label}`}
      >
        {children}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity bg-black/30">
          <ZoomIn className="w-6 h-6 text-white drop-shadow" />
        </div>
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 text-xs sm:text-sm truncate mr-2">{label}</h2>
              <button
                id={`photo-close-${visitId}-${type}`}
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Full-size image */}
            <div className="relative w-full h-[55vh] sm:h-[70vh] min-h-[260px] sm:min-h-[400px] max-h-[75vh]">
              <Image
                src={src}
                alt={label}
                fill
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
