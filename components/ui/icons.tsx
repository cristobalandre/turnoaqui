import React from "react";

interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

// --- FLECHAS TIMELINE ---
export const IconArrowLeft = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="round"/>
  </svg>
);

export const IconArrowRight = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="round"/>
  </svg>
);

// --- BARRA SUPERIOR ---
export const IconCalendarAudit = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M3 9H21" stroke="currentColor" strokeWidth={strokeWidth}/>
        <path d="M16 2V6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
        <path d="M8 2V6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
        <path d="M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth={strokeWidth}/>
        <path d="M15 14L17 16L12 21L7 16L9 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    </svg>
);

export const IconPlus = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 5V19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
    <path d="M5 12H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
  </svg>
);

// --- BARRA TÉCNICA ---
export const IconChart = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18 20V10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
    <path d="M12 20V4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
    <path d="M6 20V14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
  </svg>
);

export const IconUser = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={strokeWidth}/>
        <path d="M4 21V17C4 15.3431 5.34315 14 7 14H17C18.6569 14 20 15.3431 20 17V21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
    </svg>
);

// --- MODALES ---
export const IconTrash = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 6H21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
    <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
    <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square"/>
    </svg>
);

export const IconPlay = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    </svg>
);

export const IconStop = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="5" y="5" width="14" height="14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="square"/>
    </svg>
);

 export const IconX = ({ className = "", size = 24, strokeWidth = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="round"/>
    </svg>
);