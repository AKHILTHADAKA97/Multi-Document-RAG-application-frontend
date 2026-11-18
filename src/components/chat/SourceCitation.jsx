import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react';

export default function SourceCitation({ source, index }) {
  const [expanded, setExpanded] = useState(false);

  const documentName = source.document_name || source.filename || 'Unknown Document';
  const pageNumber = source.page_number;
  const sectionTitle = source.section_title;
  const sheetName = source.sheet_name;
  const rowRange = source.row_range;
  const slideNumber = source.slide_number;
  const chunkText = source.chunk_text || source.text || '';
  const relevance = source.relevance_score ? Math.round(source.relevance_score * 100) : null;
  const documentId = source.document_id;
  const citationLabel = source.citation || documentName;

  const locationParts = [];
  if (sectionTitle) locationParts.push(`Section: ${sectionTitle}`);
  else if (pageNumber) locationParts.push(`Page ${pageNumber}`);
  else if (slideNumber) locationParts.push(`Slide ${slideNumber}`);
  else if (sheetName) locationParts.push(`${sheetName}${rowRange ? ` (${rowRange})` : ''}`);

  const locationStr = locationParts.join(' • ');
  const fullCitation = locationStr ? `${documentName} — ${locationStr}` : documentName;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm hover:border-slate-300 transition-colors">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer space-x-2"
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="w-6 h-6 rounded-full bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center font-semibold text-xs shrink-0">
            {index}
          </span>
          <FileText className="w-4 h-4 text-primary-500 shrink-0" />
          <span className="font-medium text-slate-900 truncate" title={fullCitation}>
            {documentName}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {sectionTitle && (
            <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded font-medium">
              {sectionTitle}
            </span>
          )}
          {pageNumber && (
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">
              p. {pageNumber}
            </span>
          )}
          {slideNumber && (
            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-medium">
              Slide {slideNumber}
            </span>
          )}
          {sheetName && (
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-medium">
              {sheetName} {rowRange ? `(${rowRange})` : ''}
            </span>
          )}
          {relevance !== null && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
              {relevance}% match
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-500">{documentId}</span>
            {chunkText.length > 500 && (
              <span className="ml-auto text-slate-400">{chunkText.length} chars</span>
            )}
          </div>
          <div className="bg-slate-50/50 rounded-lg p-3 max-h-64 overflow-y-auto">
            <p className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-base">
              {chunkText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}