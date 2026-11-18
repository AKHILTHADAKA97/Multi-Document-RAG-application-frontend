import React, { useState, useEffect } from 'react';
import {
  HiXMark,
  HiEye,
  HiPencilSquare,
  HiArrowDownTray,
  HiArrowPath,
  HiArrowUpTray,
  HiInformationCircle,
  HiTrash,
  HiCheck,
  HiExclamationTriangle,
  HiDocumentText,
  HiClock,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { documentService } from '../../services/documentService';
import { formatFileSize, formatDate } from '../../utils/helpers';

export default function DocumentSettingsModal({
  isOpen,
  onClose,
  document: doc,
  initialTab = 'info', // 'info' | 'preview' | 'rename' | 'edit' | 'replace' | 'versions' | 'delete'
  onDocumentUpdated,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [renameInput, setRenameInput] = useState('');
  const [editContent, setEditContent] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [replaceFile, setReplaceFile] = useState(null);

  useEffect(() => {
    if (isOpen && doc) {
      setActiveTab(initialTab);
      setRenameInput(doc.display_filename || doc.filename || '');
      setReplaceFile(null);
      loadTabContent(initialTab);
    }
  }, [isOpen, doc, initialTab]);

  const loadTabContent = async (tab) => {
    if (!doc) return;
    if (tab === 'preview' || tab === 'edit') {
      try {
        setLoading(true);
        const data = await documentService.previewDocument(doc.id);
        setPreviewData(data);
        if (tab === 'edit') {
          setEditContent(data.preview_text || '');
        }
      } catch (err) {
        toast.error('Failed to load document preview');
      } finally {
        setLoading(false);
      }
    } else if (tab === 'versions') {
      try {
        setLoading(true);
        const res = await documentService.getDocumentVersions(doc.id);
        setVersions(res.versions || []);
      } catch (err) {
        console.warn('Failed to load versions', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    loadTabContent(tab);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameInput.trim()) {
      toast.error('Filename cannot be empty');
      return;
    }
    try {
      setActionLoading(true);
      const updated = await documentService.renameDocument(doc.id, renameInput.trim());
      toast.success('Document renamed successfully');
      if (onDocumentUpdated) onDocumentUpdated(updated);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to rename document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setActionLoading(true);
      const updated = await documentService.updateDocumentContent(doc.id, editContent);
      toast.success('Document updated. AI reprocessing queued.');
      if (onDocumentUpdated) onDocumentUpdated(updated);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update document content');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replaceFile) {
      toast.error('Please choose a replacement file');
      return;
    }
    try {
      setActionLoading(true);
      const updated = await documentService.replaceDocument(doc.id, replaceFile);
      toast.success('File replaced. AI reprocessing queued.');
      if (onDocumentUpdated) onDocumentUpdated(updated);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to replace file');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReprocess = async () => {
    try {
      setActionLoading(true);
      await documentService.reprocessDocument(doc.id);
      toast.success('Reprocessing queued for document');
      if (onDocumentUpdated) onDocumentUpdated({ ...doc, processing_status: 'Pending' });
      onClose();
    } catch (err) {
      toast.error('Failed to trigger reprocessing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await documentService.deleteDocument(doc.id);
      toast.success('Document permanently deleted');
      if (onDocumentUpdated) onDocumentUpdated(null, doc.id);
      onClose();
    } catch (err) {
      toast.error('Failed to delete document');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !doc) return null;

  const ext = (doc.file_extension || doc.file_type || '').toLowerCase();
  const isEditable = ['.txt', '.json', '.csv', '.tsv', '.md', '.html', '.htm', '.xml'].includes(ext);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-100/80 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <HiDocumentText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {doc.display_filename || doc.filename}
              </h3>
              <p className="text-xs text-gray-500">
                {formatFileSize(doc.file_size)} • {doc.file_extension || doc.file_type} • Status: <span className="font-semibold text-gray-700">{doc.processing_status || 'Ready'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto gap-2">
          {[
            { id: 'info', label: 'File Info', icon: HiInformationCircle },
            { id: 'preview', label: 'Preview', icon: HiEye },
            { id: 'rename', label: 'Rename', icon: HiPencilSquare },
            { id: 'edit', label: 'Edit Content', icon: HiDocumentText },
            { id: 'replace', label: 'Replace File', icon: HiArrowUpTray },
            { id: 'versions', label: 'Versions', icon: HiClock },
            { id: 'delete', label: 'Delete', icon: HiTrash, danger: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? tab.danger
                      ? 'border-red-600 text-red-600'
                      : 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {/* 1. FILE INFORMATION TAB */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block mb-1">
                    Display Filename
                  </span>
                  <span className="text-sm font-semibold text-gray-900 break-all">
                    {doc.display_filename || doc.filename}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Original Upload Name
                  </span>
                  <span className="text-sm font-semibold text-gray-900 break-all">
                    {doc.original_filename || doc.filename}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    File Size & Format
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatFileSize(doc.file_size)} • {doc.file_extension || doc.file_type} ({doc.mime_type || 'application/octet-stream'})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Internal Storage Key
                  </span>
                  <span className="text-xs font-mono text-gray-700 break-all">
                    {doc.storage_key || 'Stored in local documents repository'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    RAG Index Statistics
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {doc.num_chunks || 0} vector chunk(s) • {doc.num_pages || 1} page(s)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Processing Status
                  </span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        doc.processing_status === 'Ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.processing_status === 'Waiting for API Credits'
                          ? 'bg-purple-100 text-purple-800'
                          : doc.processing_status === 'Failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.processing_status || 'Ready'}
                    </span>
                    {(doc.processing_status === 'Failed' || doc.processing_status === 'Waiting for API Credits') && (
                      <button
                        onClick={handleReprocess}
                        disabled={actionLoading}
                        className="text-xs text-orange-600 hover:text-orange-700 font-semibold underline cursor-pointer"
                      >
                        Retry Processing
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 sm:col-span-2">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Document ID & Upload Date
                  </span>
                  <span className="text-xs font-mono text-gray-600 block mb-1">
                    {doc.id}
                  </span>
                  <span className="text-xs text-gray-500">
                    Uploaded on {formatDate(doc.uploaded_at || doc.created_at)}
                  </span>
                </div>
              </div>

              {doc.error_message && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
                  <HiExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block mb-0.5">Status Notice</span>
                    <p className="text-xs text-amber-800">{doc.error_message}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons in Info */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => documentService.downloadDocument(doc.id, doc.display_filename || doc.filename)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold flex items-center space-x-2 cursor-pointer"
                >
                  <HiArrowDownTray className="w-4 h-4" />
                  <span>Download Original</span>
                </button>
                <button
                  onClick={handleReprocess}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-semibold flex items-center space-x-2 cursor-pointer"
                >
                  <HiArrowPath className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span>Retry Processing</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. PREVIEW TAB */}
          {activeTab === 'preview' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  <HiArrowPath className="w-6 h-6 animate-spin text-orange-500" />
                  <span className="ml-2 text-xs">Loading preview...</span>
                </div>
              ) : previewData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Format: <strong className="text-gray-800">{previewData.file_type}</strong> • Pages: {previewData.total_pages}
                    </span>
                    {previewData.is_truncated && (
                      <span className="text-amber-600 font-medium">Preview truncated for performance</span>
                    )}
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed">
                    {previewData.preview_text || 'No preview text available.'}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No preview available.</p>
              )}
            </div>
          )}

          {/* 3. RENAME TAB */}
          {activeTab === 'rename' && (
            <form onSubmit={handleRename} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  New Display Filename
                </label>
                <input
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter new filename..."
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Original extension (<strong className="text-gray-700">{ext}</strong>) will be preserved automatically.
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-all shadow-subtle cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Rename'}
                </button>
                <button
                  type="button"
                  onClick={() => setRenameInput(doc.display_filename || doc.filename)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </form>
          )}

          {/* 4. EDIT CONTENT TAB */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              {!isEditable ? (
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                  <HiInformationCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-bold text-amber-900">Direct Editing Not Supported for {ext}</h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto">
                    Binary formats such as Word, Excel, and PDF cannot be safely edited as raw text.
                    Please download the file, edit it externally, and use <strong>Replace File</strong> to upload the revised version.
                  </p>
                  <div className="flex justify-center space-x-3 pt-2">
                    <button
                      onClick={() => documentService.downloadDocument(doc.id, doc.display_filename || doc.filename)}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-800 text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Download Original
                    </button>
                    <button
                      onClick={() => handleTabChange('replace')}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Go to Replace File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold">
                      Format: <strong className="text-gray-800">{ext}</strong> (Changes create a new file version and trigger reindexing)
                    </span>
                    {ext === '.json' && (
                      <span className="text-[11px] text-blue-600 font-semibold">JSON syntax validation active</span>
                    )}
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={14}
                    className="w-full p-4 rounded-2xl border border-gray-300 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 leading-relaxed"
                    placeholder="Enter document text content..."
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-subtle cursor-pointer"
                    >
                      {actionLoading ? 'Saving New Version...' : 'Save & Reprocess'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. REPLACE FILE TAB */}
          {activeTab === 'replace' && (
            <form onSubmit={handleReplaceSubmit} className="space-y-4 max-w-md">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800">
                Uploading a replacement will preserve previous versions, update the file on disk, invalidate outdated vector chunks, and queue background reprocessing.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select New File
                </label>
                <input
                  type="file"
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                  required
                />
              </div>

              {replaceFile && (
                <div className="text-xs text-gray-600">
                  Selected: <strong className="text-gray-900">{replaceFile.name}</strong> ({formatFileSize(replaceFile.size)})
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading || !replaceFile}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-subtle cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Replacing...' : 'Upload Replacement File'}
              </button>
            </form>
          )}

          {/* 6. VERSIONS TAB */}
          {activeTab === 'versions' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Version History</h4>
              {loading ? (
                <div className="py-6 text-center text-xs text-gray-400">Loading versions...</div>
              ) : versions.length === 0 ? (
                <p className="text-xs text-gray-500">Only initial version (v1) stored.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                          v{v.version}
                        </span>
                        <div>
                          <span className="font-semibold text-gray-900 block">
                            {v.note || `Version ${v.version}`}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {formatFileSize(v.file_size)} • {formatDate(v.created_at)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 break-all max-w-[200px] truncate">
                        {v.storage_key}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. DELETE CONFIRMATION TAB */}
          {activeTab === 'delete' && (
            <div className="space-y-4 max-w-md">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <strong className="block font-bold">Warning: Irreversible Action</strong>
                <p>
                  Deleting this document will permanently delete the original file from storage, remove all metadata from MongoDB, and eliminate all indexed vector chunks from ChromaDB.
                </p>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
