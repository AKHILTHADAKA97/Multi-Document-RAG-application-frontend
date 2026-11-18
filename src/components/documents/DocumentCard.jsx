import React, { useState } from 'react';
import {
  HiTrash,
  HiOutlineCalendar,
  HiOutlineHashtag,
  HiOutlineDocumentDuplicate,
  HiArrowPath,
  HiOutlineDocumentArrowDown,
} from 'react-icons/hi2';
import { formatFileSize, formatDate, truncateText, getFileTypeIcon, getFileTypeColor } from '../../utils/helpers';

export default function DocumentCard({ doc, onDelete, isGridView = true }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const id = doc.id || doc._id || doc.filename;
  const filename = doc.filename || doc.name || 'Untitled Document';
  const size = doc.file_size || doc.size || 0;
  const chunkCount = doc.chunk_count ?? doc.total_chunks ?? doc.chunks ?? 0;
  const pageCount = doc.page_count ?? doc.pages ?? (doc.metadata?.page_count ?? 1);
  const uploadDate = doc.created_at || doc.upload_date || doc.timestamp || new Date().toISOString();
  const fileType = doc.file_type || doc.content_type || '';

  const colors = getFileTypeColor(fileType, filename);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(id);
    } catch {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!isGridView) {
    // List row view
    return (
      <div className="group flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all duration-200">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.border} border`}>
            {getFileTypeIcon(fileType, filename, 'w-5 h-5')}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition-colors" title={filename}>
              {filename}
            </h3>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
              <span>{formatFileSize(size)}</span>
              <span>•</span>
              <span>{chunkCount} chunks</span>
              {pageCount > 0 && (
                <>
                  <span>•</span>
                  <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
                </>
              )}
              <span>•</span>
              <span>{formatDate(uploadDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {showConfirm ? (
            <div className="flex items-center space-x-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-rose-500/30">
              <span className="text-xs text-rose-300">Confirm delete?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-0.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isDeleting}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-70 group-hover:opacity-100"
              title="Delete document"
              aria-label="Delete document"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid card view
  return (
    <div className="group relative flex flex-col justify-between p-5 bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.border} border shadow-inner`}>
            {getFileTypeIcon(fileType, filename, 'w-6 h-6')}
          </div>

          <div className="flex items-center space-x-1">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${colors.badge}`}>
              {filename.split('.').pop() || 'DOC'}
            </span>

            {showConfirm ? (
              <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-rose-500/40 shadow-xl">
                <span className="text-[11px] text-rose-300">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2 py-0.5 text-[11px] bg-rose-600 hover:bg-rose-500 text-white rounded font-medium"
                >
                  {isDeleting ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  className="px-1.5 py-0.5 text-[11px] bg-slate-800 text-slate-300 rounded"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-60 group-hover:opacity-100"
                title="Delete document"
                aria-label="Delete document"
              >
                <HiTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors"
          title={filename}
        >
          {filename}
        </h3>
      </div>

      {/* Metadata Badges */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
            <HiOutlineHashtag className="w-3.5 h-3.5 text-indigo-400" />
            <span>{chunkCount} chunks</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
            <HiOutlineDocumentDuplicate className="w-3.5 h-3.5 text-indigo-400" />
            <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="font-mono">{formatFileSize(size)}</span>
          <span className="flex items-center text-slate-400">
            <HiOutlineCalendar className="w-3 h-3 mr-1" />
            {formatDate(uploadDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
