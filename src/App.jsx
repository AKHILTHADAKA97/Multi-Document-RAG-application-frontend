import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Chat from './pages/Chat';
import Documents from './pages/Documents';
import History from './pages/History';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 relative overflow-hidden bg-white">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main workspace */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-white">
          <Routes>
            {/* Chatting page is the default root home page */}
            <Route path="/" element={<Chat />} />
            <Route path="/chat" element={<Chat />} />
            {/* Dashboard completely removed - redirected to chat */}
            <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Toast Notifications (Clean white SaaS style) */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#FFFFFF',
            color: '#111827',
            border: '1px solid #E5E7EB',
            borderRadius: '0.75rem',
            fontSize: '0.85rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#16A34A',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  );
}
