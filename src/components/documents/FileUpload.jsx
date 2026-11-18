import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  HiArrowUpTray,
  HiDocumentText,
  HiXMark,
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowPath,
  HiSparkles,
} from 'react-icons/hi2';
import { documentService } from '../../services/documentService';
import { formatFileSize, getFileTypeIcon, getFileTypeColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function FileUpload({ onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      rejectedFiles.forEach((file) => {
        toast.error(`"${file.file.name}" was rejected. Only PDF, DOCX, and TXT files under 50MB are supported.`);
      });
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const newItems = acceptedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        file,
        status: 'queued', // queued | uploading | success | error
        errorMsg: null,
      }));

      setSelectedFiles((prev) => [...prev, ...newItems]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB limit
    multiple: true,
  });

  const removeFile = (id) => {
    if (isUploading) return;
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllFiles = () => {
    if (isUploading) return;
    setSelectedFiles([]);
    setUploadProgress(0);
  };

  const handleUploadAll = async () => {
    const queuedFiles = selectedFiles.filter((item) => item.status !== 'success');
    if (queuedFiles.length === 0) {
      toast('No new files to upload', { icon: 'ℹ️' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Mark queued files as uploading
    setSelectedFiles((prev) =>
      prev.map((item) =>
        item.status !== 'success' ? { ...item, status: 'uploading', errorMsg: null } : item
      )
    );

    const rawFiles = queuedFiles.map((item) => item.file);

    try {
      await documentService.uploadDocuments(rawFiles, (percent) => {
        setUploadProgress(percent);
      });

      // Mark all as success
      setSelectedFiles((prev) =>
        prev.map((item) => ({ ...item, status: 'success' }))
      );

      toast.success(`Successfully uploaded ${rawFiles.length} document(s) & generated vector embeddings!`);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err.userMessage || 'Failed to upload documents. Please check backend connection.';
      setSelectedFiles((prev) =>
        prev.map((item) => (item.status === 'uploading' ? { ...item, status: 'error', errorMsg: msg } : item))
      );
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const queuedCount = selectedFiles.filter((f) => f.status === 'queued' || f.status === 'error').length;
  const successCount = selectedFiles.filter((f) => f.status === 'success').length;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <HiArrowUpTray className="w-5 h-5 text-indigo-400" />
            Upload Knowledge Base Documents
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Supported formats: PDF, DOCX, TXT. Documents are chunked and indexed into the vector store.
          </p>
        </div>
        {selectedFiles.length > 0 && (
          <button
            onClick={clearAllFiles}
            disabled={isUploading}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            Clear list
          </button>
        )}
      </div>

      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
            : isDragReject
            ? 'border-rose-500 bg-rose-500/10'
            : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-950/70'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <HiArrowUpTray className="w-7 h-7 animate-bounce-soft" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-200">
              {isDragActive ? (
                <span className="text-indigo-400 font-semibold">Drop the files here to upload...</span>
              ) : (
                <>
                  <span className="text-indigo-400 font-semibold hover:underline">Click to browse</span> or drag and drop files here
                </>
              )}
            </p>
            <p className="text-xs text-slate-500">
              PDF, Word (.docx) or Text (.txt) up to 50MB each
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-rose-300">.PDF</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-blue-300">.DOCX</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-300">.TXT</span>
          </div>
        </div>
      </div>

      {/* Selected File Previews */}
      {selectedFiles.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Files to upload ({selectedFiles.length})
              {successCount > 0 && <span className="text-emerald-400 ml-1.5">• {successCount} uploaded</span>}
            </span>
            {isUploading && (
              <span className="text-indigo-400 font-medium">Processing & Embedding: {uploadProgress}%</span>
            )}
          </div>

          {/* Overall progress bar during active upload */}
          {isUploading && (
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* List of staged files */}
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((item) => {
              const colors = getFileTypeColor(item.file.type, item.file.name);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    item.status === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : item.status === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-slate-800/40 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.border} border`}>
                      {getFileTypeIcon(item.file.type, item.file.name, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatFileSize(item.file.size)}
                        {item.errorMsg && <span className="text-rose-400 ml-2 font-medium">{item.errorMsg}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {item.status === 'success' && (
                      <span className="flex items-center text-xs text-emerald-400 font-medium">
                        <HiCheckCircle className="w-4 h-4 mr-1 text-emerald-400" />
                        Uploaded
                      </span>
                    )}

                    {item.status === 'uploading' && (
                      <span className="flex items-center text-xs text-indigo-400 font-medium animate-pulse">
                        <HiArrowPath className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Uploading
                      </span>
                    )}

                    {item.status === 'error' && (
                      <span className="flex items-center text-xs text-rose-400 font-medium">
                        <HiExclamationCircle className="w-4 h-4 mr-1 text-rose-400" />
                        Failed
                      </span>
                    )}

                    {!isUploading && item.status !== 'success' && (
                      <button
                        onClick={() => removeFile(item.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Remove file"
                      >
                        <HiXMark className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={handleUploadAll}
              disabled={isUploading || queuedCount === 0}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {isUploading ? (
                <>
                  <HiArrowPath className="w-4 h-4 animate-spin" />
                  <span>Processing Documents...</span>
                </>
              ) : (
                <>
                  <HiSparkles className="w-4 h-4" />
                  <span>Upload & Embed ({queuedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
