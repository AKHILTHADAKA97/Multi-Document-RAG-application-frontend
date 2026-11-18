import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiDocumentText,
  HiTrash,
  HiArrowDownTray,
  HiMagnifyingGlass,
  HiFolder,
  HiArrowUpTray,
  HiEllipsisVertical,
  HiEye,
  HiPencilSquare,
  HiArrowPath,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiClock,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { documentService } from '../services/documentService';
import { formatFileSize, formatDate } from '../utils/helpers';
import DocumentSettingsModal from '../components/documents/DocumentSettingsModal';
import UploadModal from '../components/documents/UploadModal';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    total_documents: 0,
    total_storage_bytes: 0,
    processing_count: 0,
    failed_count: 0,
    ready_count: 0,
    waiting_credits_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [settingsModalDoc, setSettingsModalDoc] = useState(null);
  const [settingsInitialTab, setSettingsInitialTab] = useState('info');
  const [activeMenuDocId, setActiveMenuDocId] = useState(null);

  const fetchDocumentsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      const [docsRes, statsRes] = await Promise.all([
        documentService.getDocuments({
          search: searchQuery || undefined,
          format: typeFilter !== 'ALL' ? typeFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          sort_by: sortBy,
        }),
        documentService.getDocumentStats(),
      ]);

      setDocuments(docsRes.documents || []);
      setStats(statsRes || {
        total_documents: docsRes.total_count || 0,
        total_storage_bytes: (docsRes.documents || []).reduce((acc, d) => acc + (d.file_size || 0), 0),
        processing_count: 0,
        failed_count: 0,
        ready_count: 0,
        waiting_credits_count: 0,
      });
    } catch (err) {
      toast.error('Failed to load documents from backend');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchDocumentsAndStats();
  }, [fetchDocumentsAndStats]);

  // Periodic polling for active processing states
  useEffect(() => {
    const hasActiveProcessing = documents.some((d) =>
      ['Pending', 'Extracting', 'Chunking', 'Embedding', 'Indexing'].includes(d.processing_status)
    );
    if (!hasActiveProcessing) return;

    const timer = setInterval(() => {
      fetchDocumentsAndStats();
    }, 3000);

    return () => clearInterval(timer);
  }, [documents, fetchDocumentsAndStats]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuDocId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const openSettings = (doc, tab = 'info', e = null) => {
    if (e) e.stopPropagation();
    setActiveMenuDocId(null);
    setSettingsModalDoc(doc);
    setSettingsInitialTab(tab);
  };

  const handleDocumentUpdated = () => {
    fetchDocumentsAndStats();
    setSelectedIds(new Set());
  };

  // Bulk selection handlers
  const handleToggleSelect = (docId, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedDocs.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkDeleting(true);
      await documentService.bulkDeleteDocuments(Array.from(selectedIds));
      toast.success(`Successfully deleted ${selectedIds.size} document(s)`);
      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      fetchDocumentsAndStats();
    } catch {
      toast.error('Failed to delete selected documents');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Client-side pagination
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const name = (doc.display_filename || doc.filename || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (typeFilter !== 'ALL') {
        const ext = (doc.file_extension || doc.file_type || '').toLowerCase();
        if (ext !== typeFilter.toLowerCase()) return false;
      }

      if (statusFilter !== 'ALL') {
        const st = (doc.processing_status || doc.status || '').toLowerCase();
        if (st !== statusFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [documents, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredDocs.length / pageSize) || 1;
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, currentPage, pageSize]);

  const getStatusBadge = (statusStr) => {
    const s = statusStr || 'Ready';
    if (s === 'Ready') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <HiCheckCircle className="w-3.5 h-3.5 mr-1" />
          Ready
        </span>
      );
    }
    if (s === 'Waiting for API Credits') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800" title="Waiting for available AI quota">
          <HiClock className="w-3.5 h-3.5 mr-1" />
          Waiting Credits
        </span>
      );
    }
    if (s === 'Failed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
          <HiExclamationCircle className="w-3.5 h-3.5 mr-1" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
        <HiArrowPath className="w-3.5 h-3.5 mr-1 animate-spin" />
        {s}
      </span>
    );
  };

  return (
    <div className="min-h-full bg-white p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── Page Header with Stats & Upload Button ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            All Files
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Production-grade document storage, format parsers, and vector index management.
          </p>
        </div>

        {/* Stats & Upload Document Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 text-xs font-semibold text-gray-700">
            <span>Total:</span>
            <strong className="text-gray-900">{stats.total_documents} docs</strong>
            <span className="text-gray-300">|</span>
            <span>Storage:</span>
            <strong className="text-blue-600">{formatFileSize(stats.total_storage_bytes)}</strong>
            {stats.processing_count > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center text-amber-700">
                  <HiArrowPath className="w-3 h-3 mr-0.5 animate-spin" />
                  {stats.processing_count} processing
                </span>
              </>
            )}
            {stats.failed_count > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-red-600 font-bold">{stats.failed_count} failed</span>
              </>
            )}
            {stats.waiting_credits_count > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-purple-600 font-bold">{stats.waiting_credits_count} waiting credits</span>
              </>
            )}
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-subtle transition-all cursor-pointer shrink-0"
          >
            <HiArrowUpTray className="w-4 h-4 stroke-[2.2]" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* ─── Search, Filters, and Bulk Actions Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <HiMagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search documents by name..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Format Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">All Formats</option>
            <option value=".pdf">PDF (.pdf)</option>
            <option value=".docx">Word (.docx)</option>
            <option value=".txt">Text (.txt)</option>
            <option value=".csv">CSV (.csv)</option>
            <option value=".json">JSON (.json)</option>
            <option value=".xlsx">Excel (.xlsx)</option>
            <option value=".pptx">PowerPoint (.pptx)</option>
            <option value=".md">Markdown (.md)</option>
            <option value=".html">HTML (.html)</option>
            <option value=".xml">XML (.xml)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Ready">Ready</option>
            <option value="Pending">Pending</option>
            <option value="Extracting">Extracting</option>
            <option value="Chunking">Chunking</option>
            <option value="Embedding">Embedding</option>
            <option value="Indexing">Indexing</option>
            <option value="Waiting for API Credits">Waiting Credits</option>
            <option value="Failed">Failed</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="date">Sort: Upload Date (Newest)</option>
            <option value="date_asc">Sort: Upload Date (Oldest)</option>
            <option value="name">Sort: Filename (A-Z)</option>
            <option value="size">Sort: File Size (Largest)</option>
          </select>
        </div>

        {/* Bulk Actions Button */}
        {selectedIds.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-700">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <HiTrash className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Files Table ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedDocs.length > 0 && selectedIds.size === paginatedDocs.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 font-bold text-gray-700">Filename</th>
                <th className="py-3.5 px-3 font-bold text-gray-700">Type</th>
                <th className="py-3.5 px-3 font-bold text-gray-700">Size</th>
                <th className="py-3.5 px-4 font-bold text-gray-700">Upload Date</th>
                <th className="py-3.5 px-3 font-bold text-gray-700">Processing Status</th>
                <th className="py-3.5 pr-4 pl-2 text-right font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <HiArrowPath className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                    <span className="text-xs">Loading files from repository...</span>
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <HiFolder className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">No documents found</p>
                    <p className="text-xs text-gray-400 mt-1">Upload files to get started.</p>
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const isSelected = selectedIds.has(doc.id);
                  const isMenuOpen = activeMenuDocId === doc.id;
                  const extName = (doc.file_extension || doc.file_type || '').toUpperCase();

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => openSettings(doc, 'info')}
                      className={`hover:bg-orange-50/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(doc.id, e)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>

                      {/* Filename */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 max-w-xs sm:max-w-md truncate">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                            <HiDocumentText className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="truncate block font-bold text-gray-900 hover:text-orange-600">
                              {doc.display_filename || doc.filename}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {doc.num_chunks || 0} chunks • {doc.num_pages || 1} pgs
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-mono text-[11px] font-semibold">
                          {extName || 'FILE'}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-3 font-mono text-gray-600 text-xs">
                        {formatFileSize(doc.file_size)}
                      </td>

                      {/* Upload Date */}
                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        {formatDate(doc.uploaded_at || doc.created_at)}
                      </td>

                      {/* Processing Status */}
                      <td className="py-3.5 px-3">
                        {getStatusBadge(doc.processing_status)}
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3.5 pr-4 pl-2 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          {/* Quick Preview Button */}
                          <button
                            onClick={(e) => openSettings(doc, 'preview', e)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Preview Content"
                          >
                            <HiEye className="w-4 h-4" />
                          </button>

                          {/* Quick Download Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              documentService.downloadDocument(doc.id, doc.display_filename || doc.filename);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Download Original File"
                          >
                            <HiArrowDownTray className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu Trigger */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuDocId(isMenuOpen ? null : doc.id);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Document Settings & Actions"
                            >
                              <HiEllipsisVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu Options */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-40 text-xs divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100 text-left"
                              >
                                <div className="py-1">
                                  <button
                                    onClick={(e) => openSettings(doc, 'info', e)}
                                    className="w-full px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 text-left cursor-pointer"
                                  >
                                    <HiInformationCircle className="w-4 h-4 text-blue-500" />
                                    <span>View File Information</span>
                                  </button>
                                  <button
                                    onClick={(e) => openSettings(doc, 'preview', e)}
                                    className="w-full px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 text-left cursor-pointer"
                                  >
                                    <HiEye className="w-4 h-4 text-gray-500" />
                                    <span>Preview Content</span>
                                  </button>
                                  <button
                                    onClick={(e) => openSettings(doc, 'rename', e)}
                                    className="w-full px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 text-left cursor-pointer"
                                  >
                                    <HiPencilSquare className="w-4 h-4 text-gray-500" />
                                    <span>Rename Document</span>
                                  </button>
                                  <button
                                    onClick={(e) => openSettings(doc, 'edit', e)}
                                    className="w-full px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 text-left cursor-pointer"
                                  >
                                    <HiDocumentText className="w-4 h-4 text-gray-500" />
                                    <span>Edit Document</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuDocId(null);
                                      documentService.downloadDocument(doc.id, doc.display_filename || doc.filename);
                                    }}
                                    className="w-full px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 text-left cursor-pointer"
                                  >
                                    <HiArrowDownTray className="w-4 h-4 text-gray-500" />
                                    <span>Download File</span>
                                  </button>
                                  <button
                                    onClick={(e) => openSettings(doc, 'replace', e)}
                                    className="w-full px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 text-left cursor-pointer"
                                  >
                                    <HiArrowUpTray className="w-4 h-4 text-gray-500" />
                                    <span>Replace File</span>
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setActiveMenuDocId(null);
                                      try {
                                        await documentService.reprocessDocument(doc.id);
                                        toast.success('Reprocessing queued');
                                        fetchDocumentsAndStats();
                                      } catch {
                                        toast.error('Failed to trigger reprocessing');
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 text-left cursor-pointer"
                                  >
                                    <HiArrowPath className="w-4 h-4 text-orange-500" />
                                    <span>Retry Processing</span>
                                  </button>
                                </div>

                                <div className="py-1">
                                  <button
                                    onClick={(e) => openSettings(doc, 'delete', e)}
                                    className="w-full px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2 text-left cursor-pointer"
                                  >
                                    <HiTrash className="w-4 h-4" />
                                    <span>Delete Document</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-gray-50/60 border-t border-gray-200 gap-3 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-300 rounded-lg px-2 py-1 font-semibold text-gray-700 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>
              Showing {filteredDocs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredDocs.length)} of {filteredDocs.length}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-gray-700 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── Bulk Delete Confirmation Modal ─── */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-gray-900">Confirm Bulk Delete</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to permanently delete <strong>{selectedIds.size}</strong> selected document(s)? This will delete their original files, database records, and vector index embeddings.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsBulkDeleteOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Document Settings & Actions Modal ─── */}
      <DocumentSettingsModal
        isOpen={Boolean(settingsModalDoc)}
        onClose={() => setSettingsModalDoc(null)}
        document={settingsModalDoc}
        initialTab={settingsInitialTab}
        onDocumentUpdated={handleDocumentUpdated}
      />

      {/* ─── Responsive Upload Modal ─── */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchDocumentsAndStats}
      />
    </div>
  );
}
