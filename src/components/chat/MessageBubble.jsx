import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import AnswerToolbar from './AnswerToolbar';
import { User, Bot } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} py-1`}>
      <div
        className={`flex space-x-2 w-full min-w-0 ${
          isUser
            ? 'flex-row-reverse max-w-[80%]'
            : 'flex-row max-w-[85%]'
        }`}
      >
        {/* Avatar - only for assistant */}
        {!isUser && (
          <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-3.5 h-3.5 text-orange-600" />
          </div>
        )}

        {/* Message Container */}
        <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
          <div
            className={`px-3.5 py-2 rounded-xl text-sm leading-relaxed break-words overflow-hidden ${
              isUser
                ? 'bg-orange-500 text-white rounded-tr-xs'
                : 'bg-transparent text-slate-900 prose prose-slate max-w-none prose-text:prose-base prose-headings:text-slate-900'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : message.content && message.content.trim() ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              <div className="flex items-center space-x-2 py-0.5 px-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-slate-500 animate-pulse">
                  Thinking & searching documents...
                </span>
              </div>
            )}
          </div>

          {/* Assistant Action Toolbar */}
          {!isUser && message.content && message.content.trim() !== '' && (
            <AnswerToolbar message={message} />
          )}
        </div>

        {/* User Avatar - only for user */}
        {isUser && (
          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}