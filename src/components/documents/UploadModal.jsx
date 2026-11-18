import React, { useState, useRef } from 'react';
import {
  HiXMark,
  HiArrowUpTray,
  HiOutlineDocumentText,
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowRight,
} from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { documentService } from '../../services/documentService';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleUploadFiles = async (files) => {
    if (!files || !files.length) return;

    try {
      setUploading(true);
      setUploadProgress(15);
      setStatusMessage({ type: 'info', text: 'Uploading files to secure backend storage...' });

      await documentService.uploadDocuments(files, (percent) => {
        setUploadProgress(percent);
      });

      setStatusMessage({ type: 'success', text: `Your document has been saved successfully. Processing will begin shortly.` });
      toast.success('Your document has been saved successfully. Processing will begin shortly.');
      if (onUploadSuccess) onUploadSuccess();
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1200);
    } catch (err) {
      console.error('Upload Error:', err);
      const cat = err.category || 'Upload Failed';
      const msg = err.message || 'Server error';
      setStatusMessage({ type: 'error', text: `${cat}: ${msg}` });
      toast.error(`${cat}: ${msg}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    handleUploadFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    handleUploadFiles(files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <HiXMark className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
            <HiArrowUpTray className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              Upload Knowledge Documents
            </h2>
            <p className="text-xs text-gray-500">
              Files are saved permanently and indexed for context-grounded Q&A
            </p>
          </div>
        </div>

        {/* Drag and Drop Container (Matching Orange/White Theme) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-orange-500 bg-orange-50/80 scale-101'
              : 'border-orange-200 bg-[#FFF7ED]/70 hover:bg-[#FFF7ED] hover:border-orange-400'
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

          <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-100/90 border border-orange-200 flex items-center justify-center text-orange-600 mb-3 shadow-xs">
            <HiArrowUpTray className="w-6 h-6 stroke-[2]" />
          </div>

          <p className="text-sm font-bold text-gray-900">
            <span className="text-orange-600 underline">Browse Files</span> or drag & drop here
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports PDF, DOCX, TXT, CSV, XLSX, PPTX, JSON, Markdown up to 50MB
          </p>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
              PDF
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              DOCX
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              TXT
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              CSV/XLSX
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              JSON/MD
            </span>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="mt-4 w-full bg-orange-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress || 20}%` }}
              />
            </div>
          )}
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`mt-3.5 p-3 rounded-xl text-xs flex items-center space-x-2 border ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <HiExclamationCircle className="w-4 h-4 shrink-0 text-red-500" />
            ) : statusMessage.type === 'success' ? (
              <HiCheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping shrink-0" />
            )}
            <span className="font-medium truncate">{statusMessage.text}</span>
          </div>
        )}

        {/* Footer with View All Files action */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
          <Link
            to="/documents"
            onClick={onClose}
            className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center space-x-1"
          >
            <span>View All Files & Storage</span>
            <HiArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
