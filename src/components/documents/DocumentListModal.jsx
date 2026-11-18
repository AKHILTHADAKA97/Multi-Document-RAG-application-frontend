import React, { useState } from 'react';
import {
  HiXMark,
  HiOutlineDocumentText,
  HiArrowUpTray,
  HiMagnifyingGlass,
  HiCheckCircle,
  HiExclamationCircle,
  HiClock,
  HiCheck,
} from 'react-icons/hi2';
import { useChatContext } from '../../context/ChatContext';

export default function DocumentListModal({
  isOpen,
  onClose,
  documents = [],
  onOpenUpload,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    selectedDocuments,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
  } = useChatContext();

  if (!isOpen) return null;

  const filteredDocs = documents.filter((doc) => {
    const name = doc.display_filename || doc.filename || doc.original_filename || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status) => {
    const s = String(status || 'Ready').toLowerCase();
    if (s === 'ready' || s === 'completed') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <HiCheckCircle className="w-3 h-3 text-emerald-500" />
          <span>Ready</span>
        </span>
      );
    }
    if (s.includes('credit') || s.includes('waiting')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <HiClock className="w-3 h-3 text-amber-500" />
          <span>Waiting Credits</span>
        </span>
      );
    }
    if (s === 'failed' || s.includes('error')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
          <HiExclamationCircle className="w-3 h-3 text-red-500" />
          <span>Failed</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">
        <HiClock className="w-3 h-3 text-orange-500" />
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
              <HiOutlineDocumentText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                  Knowledge Documents
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                  {documents.length}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Select documents to target AI search scope
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search and Filter Controls */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-2.5 shrink-0">
          <div className="relative">
            <HiMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => selectAllDocuments(documents.map((d) => d.id))}
                className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
              >
                Select All
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={clearDocumentSelection}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            {selectedDocuments.length > 0 && (
              <span className="text-orange-600 font-medium">
                {selectedDocuments.length} selected
              </span>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <HiOutlineDocumentText className="w-10 h-10 mx-auto text-gray-300 stroke-[1.5]" />
              <p className="text-xs font-medium text-gray-600">
                {searchTerm ? 'No documents match your search' : 'No documents uploaded yet'}
              </p>
              <p className="text-[11px] text-gray-400">
                Upload files to query knowledge with the AI Assistant
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = selectedDocuments.includes(doc.id);
              const displayName = doc.display_filename || doc.filename || doc.original_filename || 'Document';
              const ext = (doc.file_extension || doc.file_type || '').replace('.', '').toUpperCase();

              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocumentSelection(doc.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between space-x-3 ${
                    isSelected
                      ? 'bg-orange-50/50 border-orange-300 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Checkbox indicator */}
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <HiCheck className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>

                    {/* File icon / Extension badge */}
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase shrink-0">
                      {ext || 'DOC'}
                    </div>

                    {/* File metadata */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {displayName}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-400 mt-0.5">
                        <span>{formatFileSize(doc.file_size || doc.size)}</span>
                        {doc.num_chunks > 0 && (
                          <>
                            <span>•</span>
                            <span>{doc.num_chunks} chunks</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {getStatusBadge(doc.processing_status || doc.status)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              if (onOpenUpload) onOpenUpload();
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <HiArrowUpTray className="w-4 h-4 stroke-[2]" />
            <span>Upload New Document</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
