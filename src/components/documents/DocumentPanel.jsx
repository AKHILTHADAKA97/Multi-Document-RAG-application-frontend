import React, { useState, useRef, useEffect } from 'react';
import {
  HiArrowUpTray,
  HiOutlineDocumentText,
  HiTrash,
  HiArrowDownTray,
  HiCheckCircle,
  HiChevronRight,
  HiChevronLeft,
  HiInformationCircle,
  HiArrowPath,
  HiClock,
  HiExclamationCircle,
  HiEye,
  HiPencilSquare,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { documentService } from '../../services/documentService';
import { useChatContext } from '../../context/ChatContext';
import { formatFileSize } from '../../utils/helpers';
import DocumentSettingsModal from './DocumentSettingsModal';

export default function DocumentPanel({
  availableDocuments = [],
  loadingDocs = false,
  onRefreshDocs,
  isOpen,
  onToggle,
}) {
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [settingsModalDoc, setSettingsModalDoc] = useState(null);
  const [settingsTab, setSettingsTab] = useState('info');
  const fileInputRef = useRef(null);

  const {
    selectedDocuments,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
  } = useChatContext();

  // Auto-poll active processing documents
  useEffect(() => {
    const hasActiveProcessing = availableDocuments.some((d) =>
      ['Pending', 'Extracting', 'Chunking', 'Embedding', 'Indexing'].includes(d.processing_status)
    );
    if (!hasActiveProcessing) return;

    const interval = setInterval(() => {
      if (onRefreshDocs) onRefreshDocs();
    }, 3000);

    return () => clearInterval(interval);
  }, [availableDocuments, onRefreshDocs]);

  const handleProcessUpload = async (files) => {
    if (!files || !files.length) return;

    // Check file size (50MB)
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 50MB maximum size.`);
        return;
      }
    }

    try {
      setUploading(true);
      setUploadProgress(15);

      await documentService.uploadDocuments(files, (percent) => {
        setUploadProgress(percent);
      });

      toast.success(
        files.length === 1
          ? 'Document saved successfully. Processing will begin shortly.'
          : `${files.length} documents saved successfully. Processing will begin shortly.`
      );
      if (onRefreshDocs) onRefreshDocs();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    handleProcessUpload(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    handleProcessUpload(files);
  };

  const handleDelete = async (docId, filename, e) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete "${filename}" from storage and index?`)) return;

    try {
      await documentService.deleteDocument(docId);
      toast.success(`Deleted ${filename}`);
      if (onRefreshDocs) onRefreshDocs();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = (docId, filename, e) => {
    e.stopPropagation();
    documentService.downloadDocument(docId, filename);
  };

  const handleRetry = async (docId, e) => {
    e.stopPropagation();
    try {
      await documentService.reprocessDocument(docId);
      toast.success('Reprocessing queued');
      if (onRefreshDocs) onRefreshDocs();
    } catch {
      toast.error('Failed to trigger reprocessing');
    }
  };

  const openSettings = (doc, tab, e) => {
    e.stopPropagation();
    setSettingsModalDoc(doc);
    setSettingsTab(tab);
  };

  // Resolve color icon by extension
  const getFileBadge = (filename) => {
    const ext = (filename || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return { label: '.PDF', color: 'bg-red-50 text-red-600 border-red-200' };
    }
    if (ext === 'docx' || ext === 'doc') {
      return { label: '.DOCX', color: 'bg-blue-50 text-blue-600 border-blue-200' };
    }
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return { label: `.${ext.toUpperCase()}`, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    }
    if (ext === 'json') {
      return { label: '.JSON', color: 'bg-amber-50 text-amber-600 border-amber-200' };
    }
    if (ext === 'pptx' || ext === 'ppt') {
      return { label: '.PPTX', color: 'bg-orange-50 text-orange-600 border-orange-200' };
    }
    return { label: `.${ext.toUpperCase() || 'TXT'}`, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  return (
    <div
      className={`border-l border-gray-200 bg-[#FAFAFA] flex flex-col transition-all duration-200 shrink-0 h-full overflow-hidden ${
        isOpen ? 'w-80' : 'w-10'
      }`}
    >
      {/* Panel Toggle Bar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white shrink-0">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Uploaded Documents
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-semibold">
              {availableDocuments.length}
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors mx-auto cursor-pointer"
          title={isOpen ? 'Collapse Document Panel' : 'Expand Document Panel'}
        >
          {isOpen ? <HiChevronRight className="w-4 h-4" /> : <HiChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-0">
          {/* Upload Drop Container */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all shadow-subtle group ${
              isDragOver
                ? 'border-orange-500 bg-orange-50/80 scale-101'
                : 'border-orange-200/90 bg-[#FFF7ED]/70 hover:bg-[#FFF7ED] hover:border-orange-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.csv,.tsv,.xlsx,.xls,.pptx,.ppt,.json,.md,.rtf,.odt,.html,.htm,.xml,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Icon Box */}
            <div className="w-9 h-9 mx-auto rounded-xl bg-orange-100/90 border border-orange-200 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform mb-2">
              <HiArrowUpTray className="w-4 h-4 stroke-[2]" />
            </div>

            <p className="text-xs font-bold text-gray-900">
              <span className="text-orange-600 hover:underline">Click to browse</span> or drag and drop
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">PDF, DOCX, TXT, CSV, JSON, XLSX, PPTX up to 50MB</p>

            {/* Supported format badges */}
            <div className="flex flex-wrap items-center justify-center gap-1 mt-2.5">
              {['.PDF', '.DOCX', '.TXT', '.CSV', '.JSON', '.XLSX'].map((fmt) => (
                <span
                  key={fmt}
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/80 text-gray-600 border border-orange-200"
                >
                  {fmt}
                </span>
              ))}
            </div>

            {/* Upload Progress Indicator */}
            {uploading && (
              <div className="mt-3 w-full bg-orange-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress || 25}%` }}
                />
              </div>
            )}
          </div>

          {/* Context Filter Select All / Clear Row */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-gray-500 font-medium text-[11px]">
              {selectedDocuments.length === 0
                ? 'All documents targeted'
                : `${selectedDocuments.length} of ${availableDocuments.length} selected`}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => selectAllDocuments(availableDocuments.map((d) => d.id || d.filename))}
                className="text-[11px] text-orange-600 hover:underline font-semibold cursor-pointer"
              >
                Select all
              </button>
              <button
                onClick={clearDocumentSelection}
                className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="space-y-2">
            {loadingDocs ? (
              <p className="text-xs text-gray-400 text-center py-4">Loading documents...</p>
            ) : availableDocuments.length === 0 ? (
              <div className="text-center py-7 px-3 bg-white border border-gray-200 rounded-2xl text-gray-400 shadow-xs">
                <HiOutlineDocumentText className="w-8 h-8 mx-auto text-gray-300 mb-1" />
                <p className="text-xs font-semibold text-gray-700">No documents uploaded</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Upload a document above to target your knowledge base</p>
              </div>
            ) : (
              availableDocuments.map((doc) => {
                const docId = doc.id || doc.filename;
                const isSelected = selectedDocuments.length === 0 || selectedDocuments.includes(docId);
                const status = doc.processing_status || (doc.status === 'processed' || doc.status === 'ready' ? 'Ready' : 'Pending');
                const badge = getFileBadge(doc.display_filename || doc.filename);

                const isReady = status === 'Ready';
                const isWaitingCredits = status === 'Waiting for API Credits';
                const isFailed = status === 'Failed';
                const isProcessing = ['Pending', 'Extracting', 'Chunking', 'Embedding', 'Indexing'].includes(status);

                return (
                  <div
                    key={docId}
                    onClick={() => toggleDocumentSelection(docId)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer bg-white group shadow-xs ${
                      isSelected
                        ? 'border-orange-300 ring-1 ring-orange-400/40 bg-orange-50/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex items-start space-x-2.5 truncate">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 mt-0.5 ${badge.color}`}>
                          {badge.label}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {doc.display_filename || doc.filename || doc.name}
                          </p>
                          <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 mt-0.5">
                            {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                isReady
                                  ? 'text-emerald-700'
                                  : isWaitingCredits
                                  ? 'text-purple-700'
                                  : isFailed
                                  ? 'text-red-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {isWaitingCredits ? 'Waiting Credits' : status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Checkbox indicator */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDocumentSelection(docId)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4 mt-0.5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-1">
                        {(isFailed || isWaitingCredits) && (
                          <button
                            onClick={(e) => handleRetry(doc.id, e)}
                            className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 text-[10px] font-semibold flex items-center space-x-1 cursor-pointer"
                            title="Retry document processing"
                          >
                            <HiArrowPath className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}
                        {isProcessing && (
                          <span className="text-[10px] text-amber-700 flex items-center space-x-1">
                            <HiArrowPath className="w-3 h-3 animate-spin" />
                            <span>Indexing...</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => openSettings(doc, 'preview', e)}
                          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Preview content"
                        >
                          <HiEye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => openSettings(doc, 'info', e)}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Document Settings & Info"
                        >
                          <HiInformationCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(docId, doc.display_filename || doc.filename, e)}
                          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Download file"
                        >
                          <HiArrowDownTray className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(docId, doc.display_filename || doc.filename, e)}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete permanently"
                        >
                          <HiTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Document Settings Modal */}
      <DocumentSettingsModal
        isOpen={Boolean(settingsModalDoc)}
        onClose={() => setSettingsModalDoc(null)}
        document={settingsModalDoc}
        initialTab={settingsTab}
        onDocumentUpdated={() => {
          if (onRefreshDocs) onRefreshDocs();
        }}
      />
    </div>
  );
}
