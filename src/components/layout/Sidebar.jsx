import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiPlus,
  HiChatBubbleLeftRight,
  HiClock,
  HiCog6Tooth,
  HiMagnifyingGlass,
  HiTrash,
  HiBookmark,
  HiOutlineFolder,
  HiXMark,
  HiPencilSquare,
  HiCheck,
  HiEnvelope,
  HiPhone,
  HiBriefcase,
} from 'react-icons/hi2';
import { useChatContext } from '../../context/ChatContext';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    conversations,
    activeConversationId,
    startNewChat,
    openConversation,
    deleteConversation,
    togglePinConversation,
    renameConversation,
  } = useChatContext();

  const [searchFilter, setSearchFilter] = useState('');
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartNewChat = () => {
    startNewChat();
    navigate('/chat');
    if (onClose) onClose();
  };

  const handleSelectConv = (id) => {
    openConversation(id);
    navigate('/chat');
    if (onClose) onClose();
  };

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameConversation(convId, editTitle.trim());
    }
    setEditingConvId(null);
  };

  // Group conversations by Date (Today, Yesterday, Previous 7 Days, Older)
  const groupedConversations = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysStart = todayStart - 7 * 86400000;

    const filtered = conversations.filter((c) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      const inTitle = (c.title || '').toLowerCase().includes(q);
      const inMessages = (c.messages || []).some((m) =>
        (m.content || '').toLowerCase().includes(q)
      );
      return inTitle || inMessages;
    });

    const groups = {
      Pinned: [],
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    filtered.forEach((c) => {
      if (c.pinned) {
        groups.Pinned.push(c);
        return;
      }
      const time = new Date(c.timestamp || Date.now()).getTime();
      if (time >= todayStart) {
        groups.Today.push(c);
      } else if (time >= yesterdayStart) {
        groups.Yesterday.push(c);
      } else if (time >= sevenDaysStart) {
        groups['Previous 7 Days'].push(c);
      } else {
        groups.Older.push(c);
      }
    });

    return groups;
  }, [conversations, searchFilter]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container - White SaaS palette, 260px fixed width */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top: + New Chat Button */}
          <div className="p-3.5 border-b border-gray-100 shrink-0">
            <button
              onClick={handleStartNewChat}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold text-xs border border-orange-200 transition-all cursor-pointer shadow-subtle group active:scale-98"
            >
              <HiPlus className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform stroke-[2]" />
              <span>+ New Chat</span>
            </button>

            {/* Conversation search box */}
            <div className="relative mt-2.5">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search conversations & chats.."
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <HiXMark className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <div className="px-3 pt-2 shrink-0">
            <nav className="space-y-0.5">
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <HiChatBubbleLeftRight className="w-4 h-4" />
                <span>Chat Workspace</span>
              </NavLink>

              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <HiClock className="w-4 h-4" />
                <span>Chat History Archive</span>
              </NavLink>

              <NavLink
                to="/documents"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <HiOutlineFolder className="w-4 h-4" />
                <span>All Files & Knowledge Base</span>
              </NavLink>
            </nav>
          </div>

          {/* Grouped Conversation History */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {conversations.length === 0 ? (
              <div className="text-center py-6 px-2 text-gray-400">
                <HiChatBubbleLeftRight className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                <p className="text-[11px] font-medium text-gray-500">No conversations yet</p>
                <p className="text-[10px] text-gray-400">Click + New Chat to begin</p>
              </div>
            ) : (
              Object.entries(groupedConversations).map(([label, items]) => {
                if (items.length === 0) return null;

                return (
                  <div key={label} className="space-y-1">
                    <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {label}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((conv) => {
                        const isActive = conv.id === activeConversationId;
                        const isEditing = editingConvId === conv.id;

                        return (
                          <div
                            key={conv.id}
                            onClick={() => handleSelectConv(conv.id)}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-orange-50 text-orange-600 font-semibold border border-orange-200/60'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate flex-1 min-w-0 mr-1">
                              <HiChatBubbleLeftRight
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'
                                }`}
                              />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(conv.id, e);
                                    if (e.key === 'Escape') setEditingConvId(null);
                                  }}
                                  autoFocus
                                  className="w-full bg-white border border-orange-300 rounded px-1 text-xs focus:outline-none"
                                />
                              ) : (
                                <span className="truncate">{conv.title || 'Untitled Chat'}</span>
                              )}
                            </div>

                            {/* Action icons: Pin, Rename, Delete */}
                            <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isEditing ? (
                                <button
                                  onClick={(e) => handleSaveRename(conv.id, e)}
                                  className="p-1 hover:text-emerald-600 cursor-pointer"
                                  title="Save Title"
                                >
                                  <HiCheck className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => handleStartRename(conv, e)}
                                    className="p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                                    title="Rename chat"
                                  >
                                    <HiPencilSquare className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePinConversation(conv.id);
                                    }}
                                    className={`p-0.5 cursor-pointer ${conv.pinned ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}
                                    title={conv.pinned ? 'Unpin' : 'Pin conversation'}
                                  >
                                    <HiBookmark className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteConversation(conv.id);
                                    }}
                                    className="p-0.5 text-gray-400 hover:text-red-600 cursor-pointer"
                                    title="Delete conversation"
                                  >
                                    <HiTrash className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* User profile footer with Akhil Thadaka's details */}
          <div className="p-3 border-t border-gray-200 bg-gray-50/70 shrink-0">
            <div className="flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-xs font-bold text-orange-600 shrink-0 mt-0.5">
                AT
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-gray-900 leading-tight">Akhil Thadaka</p>
                <p className="text-[11px] font-semibold text-orange-600 mt-0.5">AI / ML Engineer</p>
                <div className="mt-1 space-y-0.5 text-[10px] text-gray-500">
                  <a
                    href="mailto:akhilthadaka97@gmail.com"
                    className="hover:text-orange-600 truncate block font-medium"
                    title="akhilthadaka97@gmail.com"
                  >
                    akhilthadaka97@gmail.com
                  </a>
                  <a
                    href="tel:9121751697"
                    className="hover:text-orange-600 block font-medium"
                  >
                    +91 9121751697
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
