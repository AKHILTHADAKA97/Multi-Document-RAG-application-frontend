import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HiBars3,
  HiXMark,
  HiPlus,
  HiPhone,
  HiEnvelope,
  HiBriefcase,
  HiChatBubbleLeftRight,
  HiOutlineFolder,
  HiClock,
} from 'react-icons/hi2';
import { useChatContext } from '../../context/ChatContext';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const location = useLocation();
  const { startNewChat } = useChatContext();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getPageTitle = () => {
    if (location.pathname === '/chat' || location.pathname === '/') return 'AI Workspace';
    if (location.pathname === '/documents') return 'All Files & Documents';
    if (location.pathname === '/history') return 'Chat History';
    return 'AI Workspace';
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Mobile hamburger & Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <HiXMark className="w-5 h-5" /> : <HiBars3 className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link to="/chat" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm group-hover:bg-orange-200 transition-colors">
                <span className="font-bold text-sm tracking-tighter text-orange-600">AI</span>
              </div>
              <span className="font-semibold text-base text-gray-900 tracking-tight">
                AI Workspace
              </span>
            </Link>

            <span className="hidden sm:inline-block text-gray-300">/</span>
            <span className="hidden sm:inline-block text-xs font-medium text-gray-500">
              {getPageTitle()}
            </span>
          </div>

          {/* Right Action Icons: New Chat Button + User profile menu with Akhil Thadaka's details */}
          <div className="flex items-center space-x-2.5">
            {/* New Chat Primary Action Button */}
            <button
              onClick={startNewChat}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <HiPlus className="w-4 h-4 stroke-[2]" />
              <span>New Chat</span>
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 border border-orange-200 flex items-center justify-center text-xs font-bold text-orange-700 transition-colors cursor-pointer shadow-xs"
                title="Profile Details"
              >
                AT
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl py-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  {/* User Profile Details Header */}
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-orange-50/40 rounded-t-xl mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                        AT
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Akhil Thadaka</p>
                        <p className="text-[11px] font-semibold text-orange-600 flex items-center gap-1 mt-0.5">
                          <HiBriefcase className="w-3.5 h-3.5 shrink-0" />
                          <span>AI / ML Engineer</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-gray-600 text-[11px]">
                      <div className="flex items-center space-x-2">
                        <HiEnvelope className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a
                          href="mailto:akhilthadaka97@gmail.com"
                          className="hover:text-orange-600 truncate font-medium"
                        >
                          akhilthadaka97@gmail.com
                        </a>
                      </div>
                      <div className="flex items-center space-x-2">
                        <HiPhone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a
                          href="tel:9121751697"
                          className="hover:text-orange-600 font-medium"
                        >
                          +91 9121751697
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links inside Profile Menu */}
                  <div className="py-1">
                    <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Quick Links
                    </p>
                    <Link
                      to="/chat"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <HiChatBubbleLeftRight className="w-4 h-4 text-orange-500" />
                      <span>AI Chat Workspace</span>
                    </Link>
                    <Link
                      to="/documents"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <HiOutlineFolder className="w-4 h-4 text-orange-500" />
                      <span>All Files & Knowledge Base</span>
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <HiClock className="w-4 h-4 text-orange-500" />
                      <span>Chat History Archive</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
