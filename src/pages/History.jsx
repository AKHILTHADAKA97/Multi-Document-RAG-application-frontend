import React, { useState, useEffect } from 'react';
import {
  HiClock,
  HiTrash,
  HiChatBubbleLeftRight,
  HiArrowRight,
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useChatContext } from '../context/ChatContext';

export default function History() {
  const navigate = useNavigate();
  const { conversations, openConversation, deleteConversation } = useChatContext();
  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchTitle = (c.title || '').toLowerCase().includes(q);
    const matchMsg = (c.messages || []).some((m) =>
      (m.content || '').toLowerCase().includes(q)
    );
    return matchTitle || matchMsg;
  });

  const handleOpen = (id) => {
    openConversation(id);
    navigate('/chat');
  };

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chat History</h1>
            <p className="text-xs text-gray-500 mt-1">
              Search and reopen all past conversations across your knowledge base.
            </p>
          </div>
          <Link
            to="/chat"
            className="px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Back to Chat</span>
            <HiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations by question, answer, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white"
          />
        </div>

        {/* List */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-subtle">
          {filteredConversations.length === 0 ? (
            <div className="p-14 text-center text-gray-400">
              <HiClock className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-700">No chat history found</p>
              <p className="text-xs text-gray-500 mt-1">Start asking questions in Chat to create your history archive</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conv) => {
                const messageCount = conv.messages ? conv.messages.length : 0;
                const lastMsg = conv.messages && conv.messages.length > 0
                  ? conv.messages[conv.messages.length - 1].content
                  : '';

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleOpen(conv.id)}
                    className="p-4 hover:bg-gray-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="truncate flex-1 min-w-0 mr-4">
                      <div className="flex items-center space-x-2">
                        <HiChatBubbleLeftRight className="w-4 h-4 text-orange-500 shrink-0" />
                        <h3 className="text-xs font-semibold text-gray-900 truncate">
                          {conv.title || 'Untitled Conversation'}
                        </h3>
                        {conv.pinned && (
                          <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium border border-orange-200">
                            Pinned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {lastMsg || 'No messages in conversation'}
                      </p>
                      <div className="flex items-center space-x-3 text-[10px] text-gray-400 mt-1.5">
                        <span>{new Date(conv.timestamp || Date.now()).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{messageCount} turn{messageCount !== 1 ? 's' : ''}</span>
                        {conv.selectedDocuments?.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{conv.selectedDocuments.length} doc context</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete conversation"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
