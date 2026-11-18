import React, { useState, useMemo } from 'react';
import {
  HiMagnifyingGlass,
  HiSquares2X2,
  HiBars4,
  HiArrowPath,
  HiDocumentText,
  HiArrowsUpDown,
  HiFolderPlus,
} from 'react-icons/hi2';
import DocumentCard from './DocumentCard';

export default function DocumentList({
  documents = [],
  isLoading = false,
  onRefresh,
  onDeleteDocument,
  onOpenUpload,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc | date-asc | name-asc | size-desc
  const [isGridView, setIsGridView] = useState(true);

  // Filter & sort documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        const name = (doc.filename || doc.name || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase().trim());
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return (a.filename || a.name || '').localeCompare(b.filename || b.name || '');
        }
        if (sortBy === 'name-desc') {
          return (b.filename || b.name || '').localeCompare(a.filename || a.name || '');
        }
        if (sortBy === 'size-desc') {
          return (b.file_size || b.size || 0) - (a.file_size || a.size || 0);
        }
        if (sortBy === 'size-asc') {
          return (a.file_size || a.size || 0) - (b.file_size || b.size || 0);
        }
        if (sortBy === 'date-asc') {
          return new Date(a.created_at || a.upload_date || 0) - new Date(b.created_at || b.upload_date || 0);
        }
        // default date-desc
        return new Date(b.created_at || b.upload_date || 0) - new Date(a.created_at || a.upload_date || 0);
      });
  }, [documents, searchTerm, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search, Filter, Sort, View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Search Bar */}
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Sorting & Layout toggles */}
        <div className="flex items-center space-x-2">
          {/* Sort dropdown */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-slate-950/60 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 pr-7 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="size-desc">Largest Size</option>
            </select>
            <HiArrowsUpDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-1.5 rounded-lg transition-colors ${
                isGridView ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <HiSquares2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                !isGridView ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
              aria-label="List View"
            >
              <HiBars4 className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-xl transition-colors"
              title="Refresh list"
              aria-label="Refresh document list"
            >
              <HiArrowPath className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Document Count Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-400 font-medium">
          Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading Skeletons */}
      {isLoading && documents.length === 0 && (
        <div className={`grid gap-4 ${isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-slate-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredDocuments.length === 0 && (
        <div className="text-center py-16 px-4 bg-slate-900/30 rounded-2xl border border-slate-800/60 flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HiDocumentText className="w-8 h-8 opacity-75" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-slate-200">
              {searchTerm ? 'No documents match your search' : 'No documents indexed yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm
                ? `Try adjusting your search query "${searchTerm}" or clear the filter.`
                : 'Upload PDFs, Word documents or text files to build your RAG knowledge base.'}
            </p>
          </div>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-colors"
            >
              Clear Search Filter
            </button>
          ) : (
            onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <HiFolderPlus className="w-4 h-4" />
                <span>Upload First Document</span>
              </button>
            )
          )}
        </div>
      )}

      {/* Documents Grid / List */}
      {filteredDocuments.length > 0 && (
        <div
          className={`grid gap-4 ${
            isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id || doc._id || doc.filename}
              doc={doc}
              onDelete={onDeleteDocument}
              isGridView={isGridView}
            />
          ))}
        </div>
      )}
    </div>
  );
}
