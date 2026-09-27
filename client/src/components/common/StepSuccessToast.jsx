import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ArrowRight, X, Pause } from 'lucide-react';

/**
 * StepSuccessToast (Compact & Sleek)
 * 
 * Supports both auto-advance mode (with countdown) and persistent confirmation mode
 * (stays until user either clicks Next Step or dismisses via X button).
 */
export const StepSuccessToast = ({
  isOpen,
  title = 'Step Complete',
  message = 'Action completed successfully.',
  nextStepLabel = 'Next Step',
  autoAdvance = true,
  autoAdvanceSeconds = 5,
  onNext,
  onDismiss,
}) => {
  const isAutoAdvancing = autoAdvance && autoAdvanceSeconds > 0;
  const [remainingMs, setRemainingMs] = useState(autoAdvanceSeconds * 1000);
  const [isPaused, setIsPaused] = useState(false);
  const totalDurationMs = autoAdvanceSeconds * 1000;

  const onNextRef = useRef(onNext);
  const onDismissRef = useRef(onDismiss);
  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const hasTriggeredNextRef = useRef(false);

  useEffect(() => {
    onNextRef.current = onNext;
    onDismissRef.current = onDismiss;
  }, [onNext, onDismiss]);

  useEffect(() => {
    if (isOpen) {
      setRemainingMs(autoAdvanceSeconds * 1000);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      elapsedBeforePauseRef.current = 0;
      hasTriggeredNextRef.current = false;
    }
  }, [isOpen, autoAdvanceSeconds, isAutoAdvancing]);

  useEffect(() => {
    if (!isOpen || !isAutoAdvancing) return;

    if (isPaused) {
      if (startTimeRef.current) {
        elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const currentRunElapsed = startTimeRef.current ? now - startTimeRef.current : 0;
      const totalElapsed = elapsedBeforePauseRef.current + currentRunElapsed;
      const timeLeft = Math.max(0, totalDurationMs - totalElapsed);

      setRemainingMs(timeLeft);

      if (timeLeft <= 0 && !hasTriggeredNextRef.current) {
        hasTriggeredNextRef.current = true;
        clearInterval(interval);
        if (onNextRef.current) {
          onNextRef.current();
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isAutoAdvancing, totalDurationMs]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onDismissRef.current) {
          onDismissRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const secondsRemaining = Math.max(1, Math.ceil(remainingMs / 1000));
  const progressPercent = totalDurationMs > 0 ? (remainingMs / totalDurationMs) * 100 : 0;

  const handleNextClick = () => {
    if (!hasTriggeredNextRef.current) {
      hasTriggeredNextRef.current = true;
      if (onNextRef.current) onNextRef.current();
    }
  };

  const handleDismissClick = (e) => {
    e.stopPropagation();
    if (onDismissRef.current) onDismissRef.current();
  };

  const toastContent = (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => isAutoAdvancing && setIsPaused(true)}
      onMouseLeave={() => isAutoAdvancing && setIsPaused(false)}
      style={{ zIndex: 99999 }}
      className="fixed bottom-5 right-5 w-[330px] max-w-[calc(100vw-2.5rem)] bg-white/95 backdrop-blur-md rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-emerald-500/40 overflow-hidden pointer-events-auto transition-all duration-200 animate-in slide-in-from-bottom-3 fade-in"
    >
      {/* Sleek Top Progress Bar (only if auto-advancing) */}
      {isAutoAdvancing && (
        <div className="w-full bg-emerald-100 h-1 overflow-hidden">
          <div
            className={`h-full transition-all ease-linear ${
              isPaused ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{
              width: `${progressPercent}%`,
              transitionDuration: isPaused ? '0ms' : '40ms',
            }}
          />
        </div>
      )}

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2.5">
          {/* Green Checkmark Icon */}
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg flex-shrink-0 mt-0.5">
            <CheckCircle2 size={17} className="stroke-[2.5]" />
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight truncate">{title}</h4>
              {isAutoAdvancing && (
                isPaused ? (
                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">
                    <Pause size={8} />
                    <span>Paused</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    {secondsRemaining}s
                  </span>
                )
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">{message}</p>
          </div>

          {/* Close Cross Button */}
          <button
            onClick={handleDismissClick}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
            title="Close"
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>

        {/* Action Footer */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={handleDismissClick}
            className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 transition-colors px-1.5 py-1 rounded hover:bg-slate-100 cursor-pointer"
          >
            Dismiss
          </button>

          <button
            onClick={handleNextClick}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold rounded-lg shadow-sm shadow-emerald-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <span>{nextStepLabel}</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
};
