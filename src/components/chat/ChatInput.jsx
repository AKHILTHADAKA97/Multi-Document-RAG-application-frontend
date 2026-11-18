import React, { useState, useRef, useEffect } from 'react';
import {
  HiStop,
  HiOutlineDocumentText,
  HiArrowUp,
  HiPaperClip,
} from 'react-icons/hi2';
import { useChatContext } from '../../context/ChatContext';

export default function ChatInput({ onSendMessage, availableDocuments = [] }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const {
    isLoading,
    isStreaming,
    stopGeneration,
    selectedDocuments,
  } = useChatContext();

  // Auto-resize textarea height up to 140px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative w-full">
      {/* 2nd Image Composer Style: Clean white container with "Ask anything..." placeholder & orange circle up arrow */}
      <div className="w-full rounded-2xl bg-gray-50/80 hover:bg-white focus-within:bg-white border border-gray-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 p-2.5 transition-all shadow-subtle flex items-center space-x-2">
        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none focus:outline-none px-2 py-1 leading-relaxed max-h-36"
        />

        {/* Action Button: Stop or Orange Circle Up Arrow (matching 2nd image exactly) */}
        <div className="shrink-0 flex items-center space-x-1.5">
          {isLoading ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm cursor-pointer animate-pulse"
              title="Stop generating"
            >
              <HiStop className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={`w-9 h-9 rounded-full transition-all cursor-pointer flex items-center justify-center border ${
                input.trim()
                  ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 shadow-sm active:scale-95'
                  : 'bg-white border-orange-300 text-orange-500 cursor-not-allowed opacity-50'
              }`}
              title="Ask AI Assistant (Enter)"
            >
              <HiArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
