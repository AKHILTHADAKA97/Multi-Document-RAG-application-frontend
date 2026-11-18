import React, { useState, useMemo } from 'react';
import SourceCitation from './SourceCitation';
import { FileText, ChevronDown, ChevronUp, BookOpen, X } from 'lucide-react';

function getDocumentKey(source) {
  return source.document_id || source.document_name || source.filename || 'unknown';
}

function getDocumentDisplayName(source) {
  return source.document_name || source.filename || 'Unknown Document';
}

export default function SourceList({ sources }) {
  const [expandedDocs, setExpandedDocs] = useState(new Set());
  const [expandedItems, setExpandedItems] = useState(new Set());

  const groupedSources = useMemo(() => {
    const groups = new Map();
    sources.forEach((source, idx) => {
      const key = getDocumentKey(source);
      if (!groups.has(key)) {
        groups.set(key, {
          documentId: key,
          documentName: getDocumentDisplayName(source),
          fileType: source.file_type || source.file_extension || '',
          items: [],
        });
      }
      groups.get(key).items.push({ ...source, originalIndex: idx });
    });
    return Array.from(groups.values());
  }, [sources]);

  const uniqueDocCount = groupedSources.length;

  const toggleDoc = (docId) => {
    setExpandedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const toggleItem = (itemKey) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <button
        onClick={() => setExpandedDocs(new Set(groupedSources.map(g => g.documentId)))}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 border border-primary-100 rounded-xl transition-colors w-full"
      >
        <FileText className="w-4 h-4 shrink-0" />
        <span>Sources ({uniqueDocCount})</span>
        {expandedDocs.size === uniqueDocCount ? (
          <ChevronUp className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-auto" />
        )}
      </button>

      <div className="mt-3 space-y-3">
        {groupedSources.map((doc, docIdx) => {
          const isDocExpanded = expandedDocs.has(doc.documentId);
          return (
            <div key={doc.documentId} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              <button
                onClick={() => toggleDoc(doc.documentId)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{doc.documentName}</p>
                    {doc.fileType && (
                      <p className="text-[11px] text-slate-500 capitalize">{doc.fileType.replace('.', '')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {doc.items.length} location{doc.items.length > 1 ? 's' : ''}
                  </span>
                  {isDocExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isDocExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/30">
                  <div className="px-4 py-3 space-y-2">
                    {doc.items.map((item, itemIdx) => {
                      const itemKey = `${doc.documentId}-${item.originalIndex}`;
                      const isItemExpanded = expandedItems.has(itemKey);
                      const locationParts = [];
                      if (item.section_title) locationParts.push(`Section: ${item.section_title}`);
                      else if (item.page_number) locationParts.push(`Page ${item.page_number}`);
                      else if (item.slide_number) locationParts.push(`Slide ${item.slide_number}`);
                      else if (item.sheet_name) locationParts.push(`${item.sheet_name}${item.row_range ? ` (${item.row_range})` : ''}`);
                      const locationStr = locationParts.join(' • ');

                      return (
                        <div
                          key={item.originalIndex}
                          className="border border-slate-200 rounded-lg bg-white overflow-hidden"
                        >
                          <button
                            onClick={() => toggleItem(itemKey)}
                            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-sm font-medium text-slate-700 truncate">
                                {locationStr || `Location ${itemIdx + 1}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {item.relevance_score !== null && item.relevance_score !== undefined && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                                  {Math.round(item.relevance_score * 100)}% match
                                </span>
                              )}
                              {isItemExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {isItemExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2.5">
                              {item.chunk_id && (
                                <div className="text-[10px] text-slate-500 font-mono mb-2 flex items-center gap-1.5">
                                  <span>Chunk ID:</span>
                                  <span className="truncate max-w-xs">{item.chunk_id}</span>
                                </div>
                              )}
                              <div className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                                {item.chunk_text || item.text || ''}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}