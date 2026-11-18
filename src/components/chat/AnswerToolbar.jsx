import React, { useState, useCallback } from 'react';
import { Copy, Check, FileText, Terminal, RefreshCw, Loader2 } from 'lucide-react';
import SourceList from './SourceList';
import RAGDiagnostics from './RAGDiagnostics';
import { useChatContext } from '../../context/ChatContext';
import toast from 'react-hot-toast';

export default function AnswerToolbar({ message }) {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { selectedDocuments, regenerateMessage } = useChatContext();

  const hasSources = message.sources && message.sources.length > 0;
  const diag = message.diagnostics;

  // Count unique documents actually cited in the answer
  const uniqueSourceCount = hasSources
    ? new Set(message.sources.map(s => s.document_id || s.document_name || s.filename).filter(Boolean)).size
    : 0;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleRegenerate = useCallback(async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    
    try {
      await regenerateMessage(message.id, selectedDocuments);
      toast.success('Answer regenerated');
    } catch (err) {
      console.error('Regenerate error:', err);
      toast.error(err.message || 'Failed to regenerate answer');
    } finally {
      setIsRegenerating(false);
    }
  }, [message.id, isRegenerating, selectedDocuments, regenerateMessage]);

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-0.5 pt-1.5">
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        disabled={isRegenerating}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Copy response"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-600">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Regenerate Button */}
      <button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Regenerate answer"
      >
        {isRegenerating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Regenerating...</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </>
        )}
      </button>

      {/* Sources Button */}
      {hasSources && (
        <button
          onClick={() => setSourcesOpen(!sourcesOpen)}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 border border-primary-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Sources ({uniqueSourceCount})</span>
          {sourcesOpen ? (
            <span className="w-3.5 h-3.5">▲</span>
          ) : (
            <span className="w-3.5 h-3.5">▼</span>
          )}
        </button>
      )}

      {/* Diagnostics Button */}
      {diag && (
        <button
          onClick={() => setDiagnosticsOpen(!diagnosticsOpen)}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          title="Developer RAG Diagnostics"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Diagnostics</span>
          {diagnosticsOpen ? (
            <span className="w-3.5 h-3.5">▲</span>
          ) : (
            <span className="w-3.5 h-3.5">▼</span>
          )}
        </button>
      )}

      {/* Sources Panel */}
      {hasSources && sourcesOpen && (
        <div className="w-full mt-2 pt-2 border-t border-gray-100">
          <SourceList sources={message.sources} />
        </div>
      )}

      {/* Diagnostics Panel */}
      {diag && diagnosticsOpen && (
        <div className="w-full mt-2 pt-2 border-t border-gray-100">
          <RAGDiagnostics diagnostics={diag} />
        </div>
      )}
    </div>
  );
}