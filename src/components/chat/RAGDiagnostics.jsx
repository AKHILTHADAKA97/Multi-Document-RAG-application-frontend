import React from 'react';
import { Cpu, Clock, Layers, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export default function RAGDiagnostics({ diagnostics }) {
  const diag = diagnostics;

  if (!diag) return null;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900">
        <div className="flex items-center space-x-2 text-blue-400 font-semibold">
          <Terminal className="w-4.5 h-4.5" />
          <span>RAG Execution Diagnostics</span>
        </div>
        <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
          Scope: {diag.retrieval_scope || diag.scope || 'All Documents'}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Eligible Docs</div>
          <div className="text-lg font-bold text-white">{diag.eligible_document_count ?? '-'}</div>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Indexed Docs</div>
          <div className="text-lg font-bold text-white">{diag.indexed_document_count ?? '-'}</div>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Candidates Found</div>
          <div className="text-lg font-bold text-cyan-300">{diag.retrieved_candidate_count ?? diag.retrieved_candidates_count ?? '-'}</div>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Context Chunks</div>
          <div className="text-lg font-bold text-emerald-300">{diag.final_context_chunk_count ?? '-'}</div>
        </div>
      </div>

      <div className="px-4 pb-2 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-300">
          <div className="flex items-center space-x-1.5">
             <Cpu className="w-3.5 h-3.5 text-indigo-400" />
             <span>
              Model: <strong>{diag.llm_provider || 'Google'} / {diag.llm_model || 'gemini-2.5-flash'}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Retrieval: <strong>{diag.retrieval_latency_ms ? `${diag.retrieval_latency_ms}ms` : '-'}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Gen Latency: <strong>{diag.generation_latency_ms ? `${diag.generation_latency_ms}ms` : '-'}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Time: <strong>{diag.total_response_time_ms || diag.total_latency_ms ? `${diag.total_response_time_ms || diag.total_latency_ms}ms` : '-'}</strong></span>
          </div>
        </div>
      </div>

      {diag.source_filenames && diag.source_filenames.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-800 text-[11px]">
          <span className="text-slate-400">Sources: </span>
          <span className="text-slate-200">{diag.source_filenames.join(', ')}</span>
        </div>
      )}

      {diag.document_statuses && Object.keys(diag.document_statuses).length > 0 && (
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Document Indexing Status</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(diag.document_statuses).map(([docId, status]) => (
              <span
                key={docId}
                className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  status === 'indexed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  status === 'not_indexed' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-red-950 text-red-300 border border-red-800'
                }`}
              >
                {docId.slice(0, 8)}…: {status}
              </span>
            ))}
          </div>
        </div>
      )}

      {diag.source_details && diag.source_details.length > 0 && (
        <div className="px-4 py-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Retrieved Evidence</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {diag.source_details.map((s, idx) => (
              <div key={idx} className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="flex items-center gap-2 text-[10px] mb-1">
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-200 truncate flex-1">{s.document_name}</span>
                  {s.relevance_score !== null && s.relevance_score !== undefined && (
                    <span className="text-emerald-400">{Math.round(s.relevance_score * 100)}%</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">{s.text_excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {diag.processing_errors && (
        <div className="px-4 py-3 bg-red-950/40 border-t border-red-900 text-red-300 text-[10px]">
          <strong>Errors:</strong> {diag.processing_errors}
        </div>
      )}
    </div>
  );
}