import React, { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import DocumentListModal from '../documents/DocumentListModal';
import { useChat } from '../../hooks/useChat';
import {
  HiSparkles,
  HiOutlineDocumentText,
  HiTrash,
  HiArrowUpTray,
  HiChatBubbleOvalLeftEllipsis,
} from 'react-icons/hi2';

export default function ChatWindow({ availableDocuments = [], onOpenUploadModal }) {
  const [isDocListOpen, setIsDocListOpen] = useState(false);
  const {
    messages,
    sendMessage,
    clearChat,
    isLoading,
    isStreaming,
    selectedDocuments,
  } = useChat();

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom smoothly on message change
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  const promptSuggestions = [
    'Summarize my uploaded document.',
    'What are the key findings and action items?',
    'Explain the core architecture described in the file.',
    'Compare the main requirements and constraints.',
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] min-h-0 bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* ─── Header: Compact AI Assistant ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100 shrink-0">
        {/* Left: AI Assistant Icon + Title + Subtitle */}
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <HiSparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
                AI Assistant
              </h2>
              {selectedDocuments.length > 0 && (
                <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-medium">
                  {selectedDocuments.length} doc{selectedDocuments.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              Answers grounded in your files
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5">
          {/* Document List Icon Button */}
          <button
            onClick={() => setIsDocListOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 border border-gray-200 transition-all cursor-pointer relative"
            title="View All Uploaded Documents"
            aria-label="View Document List"
          >
            <HiOutlineDocumentText className="w-3.5 h-3.5" />
            {availableDocuments.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                {availableDocuments.length}
              </span>
            )}
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-all cursor-pointer"
              title="Clear current conversation"
            >
              <HiTrash className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Upload Document Button */}
          <button
            onClick={onOpenUploadModal}
            className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            title="Upload Document"
          >
            <HiArrowUpTray className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* ─── Messages Scroll Area ─── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3 bg-white min-h-0">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 px-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-orange-500 mb-2">
              <HiChatBubbleOvalLeftEllipsis className="w-6 h-6 stroke-[2]" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              How can I help you today?
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Ask a question or upload a document to get started.
            </p>

            {/* Active Document Status Badge */}
            <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-50/60 border border-orange-200/80 text-xs text-gray-700">
              <HiOutlineDocumentText className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="font-medium">
                {selectedDocuments.length > 0
                  ? `${selectedDocuments.length} document${selectedDocuments.length !== 1 ? 's' : ''} targeted for Q&A`
                  : availableDocuments.length > 0
                  ? `${availableDocuments.length} document${availableDocuments.length !== 1 ? 's' : ''} available in active context`
                  : 'No documents uploaded yet. Upload a file to get started.'}
              </span>
            </div>

            {/* Starter Suggestion Cards */}
            <div className="mt-4 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {promptSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="p-2.5 text-xs bg-gray-50 hover:bg-orange-50/70 border border-gray-200 hover:border-orange-300 rounded-lg text-gray-700 hover:text-orange-950 transition-all text-left flex items-start space-x-1.5 group cursor-pointer"
                >
                  <span className="text-orange-500 group-hover:translate-x-0.5 transition-transform">→</span>
                  <span className="leading-snug font-medium">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Active Messages */
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Loading typing indicator */}
            {isLoading && !isStreaming && (
              <div className="flex items-center space-x-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl w-fit text-gray-600 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '75ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="ml-1.5 font-medium text-gray-700">Synthesizing answer...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ─── Bottom Sticky Composer Area ─── */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <ChatInput
          onSendMessage={sendMessage}
          availableDocuments={availableDocuments}
        />
      </div>

      {/* ─── Document List Popup Modal ─── */}
      <DocumentListModal
        isOpen={isDocListOpen}
        onClose={() => setIsDocListOpen(false)}
        documents={availableDocuments}
        onOpenUpload={() => {
          setIsDocListOpen(false);
          if (onOpenUploadModal) onOpenUploadModal();
        }}
      />
    </div>
  );
}
