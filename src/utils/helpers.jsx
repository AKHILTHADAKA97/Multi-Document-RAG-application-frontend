import React from 'react';
import { 
  HiOutlineDocumentText, 
  HiOutlineDocument, 
  HiOutlineDocumentDuplicate 
} from 'react-icons/hi2';

/**
 * Format raw bytes into human-readable string (e.g. 1.25 MB)
 */
export function formatFileSize(bytes) {
  if (bytes === 0 || bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i] || 'B'}`;
}

/**
 * Format ISO or Unix date string into localized readable string
 */
export function formatDate(dateString) {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    
    // Relative format if within 24 hours
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return String(dateString);
  }
}

/**
 * Truncate string with ellipsis if it exceeds maxLength
 */
export function truncateText(text, maxLength = 80) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Detect file extension from filename or mime type
 */
export function getFileExtension(filename = '', mimeType = '') {
  const extFromName = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
  if (extFromName) return extFromName;
  
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('officedocument')) return 'docx';
  if (mimeType.includes('text')) return 'txt';
  if (mimeType.includes('csv')) return 'csv';
  return 'doc';
}

/**
 * Returns color classes based on file type
 */
export function getFileTypeColor(fileType = '', filename = '') {
  const ext = getFileExtension(filename, fileType);
  switch (ext) {
    case 'pdf':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        gradient: 'from-rose-500 to-red-600',
      };
    case 'docx':
    case 'doc':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        gradient: 'from-blue-500 to-indigo-600',
      };
    case 'txt':
    case 'md':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        gradient: 'from-emerald-500 to-teal-600',
      };
    case 'csv':
    case 'xlsx':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        gradient: 'from-amber-500 to-orange-600',
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
        badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        gradient: 'from-slate-500 to-slate-600',
      };
  }
}

/**
 * Returns an icon element for the file type
 */
export function getFileTypeIcon(fileType = '', filename = '', className = 'w-5 h-5') {
  const ext = getFileExtension(filename, fileType);
  switch (ext) {
    case 'pdf':
      return <HiOutlineDocument className={`${className} text-rose-400`} />;
    case 'docx':
    case 'doc':
      return <HiOutlineDocumentDuplicate className={`${className} text-blue-400`} />;
    case 'csv':
    case 'xlsx':
      return <HiOutlineDocumentDuplicate className={`${className} text-amber-400`} />;
    case 'txt':
    case 'md':
    default:
      return <HiOutlineDocumentText className={`${className} text-emerald-400`} />;
  }
}

/**
 * Color classes for relevance score
 */
export function calculateRelevanceColor(score) {
  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;
  // If score is normalized between 0 and 1, convert to 0-100%
  const percentage = numericScore <= 1.0 ? Math.round(numericScore * 100) : Math.round(numericScore);

  if (percentage >= 80) {
    return {
      percentage,
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      label: 'High match',
    };
  }
  if (percentage >= 50) {
    return {
      percentage,
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      pill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      label: 'Good match',
    };
  }
  return {
    percentage,
    text: 'text-amber-400',
    bg: 'bg-amber-500',
    pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    label: 'Relevant',
  };
}

/**
 * Copy text to clipboard with modern navigator API and fallback
 */
export async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  return new Promise((resolve, reject) => {
    const successful = document.execCommand('copy');
    textArea.remove();
    if (successful) resolve();
    else reject(new Error('Failed to copy text'));
  });
}
