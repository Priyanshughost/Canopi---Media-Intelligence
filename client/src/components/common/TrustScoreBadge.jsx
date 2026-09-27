import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Shield, Info, X, Check, AlertTriangle, Minus } from 'lucide-react';

/**
 * TrustScoreBadge
 * 
 * Renders an advisory 0–100 Evidence Trust Score badge with an interactive
 * factor breakdown tooltip/popover for transparent forensic auditability.
 */
export const TrustScoreBadge = ({
  score = 70,
  breakdown = [],
  size = 'md', // 'sm' | 'md' | 'lg'
  showBreakdownOnClick = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const numScore = Math.max(0, Math.min(100, Math.round(Number(score) || 70)));

  // Color coding: Green (80+), Amber (50-79), Red (<50)
  const getTheme = () => {
    if (numScore >= 80) {
      return {
        bg: 'bg-emerald-500/90 text-white border-emerald-400',
        pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        barBg: 'bg-emerald-500',
        icon: ShieldCheck,
        label: 'High Trust',
      };
    }
    if (numScore >= 50) {
      return {
        bg: 'bg-amber-500/90 text-white border-amber-400',
        pillBg: 'bg-amber-50 text-amber-800 border-amber-300',
        barBg: 'bg-amber-500',
        icon: ShieldAlert,
        label: 'Moderate Trust',
      };
    }
    return {
      bg: 'bg-red-500/90 text-white border-red-400',
      pillBg: 'bg-red-50 text-red-800 border-red-300',
      barBg: 'bg-red-500',
      icon: Shield,
      label: 'Low Trust / Review',
    };
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3.5 py-1.5 space-x-2',
  }[size] || 'text-xs px-2.5 py-1 space-x-1.5';

  const handleClick = (e) => {
    if (showBreakdownOnClick) {
      e.stopPropagation();
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Badge Pill */}
      <button
        type="button"
        onClick={handleClick}
        title="Evidence Trust Score (Click for audit breakdown)"
        className={`inline-flex items-center font-bold rounded-full border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm ${theme.pillBg} ${sizeClasses}`}
      >
        <IconComponent size={size === 'sm' ? 11 : size === 'lg' ? 16 : 13} className="stroke-[2.5]" />
        <span>{numScore}</span>
        <span className="opacity-70 text-[9px] font-normal">/100</span>
      </button>

      {/* Popover Breakdown Dialog */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 9999 }}
          className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-in fade-in zoom-in-95 duration-150 text-left"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg ${theme.pillBg}`}>
                <IconComponent size={16} />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h5 className="text-xs font-bold text-slate-900">Evidence Trust Score</h5>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${theme.pillBg}`}>
                    {numScore}/100
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{theme.label}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Score Visual Bar */}
          <div className="my-3">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${theme.barBg} transition-all duration-500`}
                style={{ width: `${numScore}%` }}
              />
            </div>
          </div>

          {/* Factor Breakdown List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Confidence Factor Breakdown
            </span>

            {breakdown.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                Initial baseline confidence applied. Additional AI and forensic factors calculated on upload.
              </p>
            ) : (
              breakdown.map((item, idx) => {
                const impact = Number(item.impact) || 0;
                const isPositive = impact > 0;
                const isNegative = impact < 0;

                return (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-800 text-[11px] truncate">{item.factor}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isNegative
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {isPositive ? `+${impact}` : impact === 0 ? '0' : `${impact}`}
                      </span>
                    </div>
                    {item.detail && (
                      <p className="text-[10px] text-slate-500 leading-snug">{item.detail}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Human Reviewer Notice */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center space-x-1.5 text-[9px] text-slate-400">
            <Info size={11} className="flex-shrink-0" />
            <span>Advisory AI signal. Human verification remains authoritative.</span>
          </div>
        </div>
      )}
    </div>
  );
};
