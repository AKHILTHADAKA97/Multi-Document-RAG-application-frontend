import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import DocumentPanel from '../components/documents/DocumentPanel';
import UploadModal from '../components/documents/UploadModal';
import { documentService } from '../services/documentService';

export default function Chat() {
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isDocPanelOpen, setIsDocPanelOpen] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoadingDocs(true);
      const res = await documentService.getDocuments();
      setAvailableDocuments(res.documents || []);
    } catch (err) {
      console.warn('Could not load documents for chat:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="h-[calc(100dvh-3.5rem)] min-h-0 flex overflow-hidden bg-white w-full">
      {/* ─── Center: Main Chat Interface ───
          On mobile (<768px/md), takes full width with NO document panel underneath.
          Fixed composer at bottom, message area internally scrollable. ─── */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full p-2 sm:p-4 bg-white overflow-hidden">
        <ChatWindow
          availableDocuments={availableDocuments}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />
      </main>

      {/* ─── Right: Dedicated Document Panel ───
          Completely hidden on mobile (<md:hidden). 
          Only renders as the 3rd column on tablet/desktop (md and up). ─── */}
      <div className="hidden md:flex h-full shrink-0">
        <DocumentPanel
          availableDocuments={availableDocuments}
          loadingDocs={loadingDocs}
          onRefreshDocs={fetchDocs}
          isOpen={isDocPanelOpen}
          onToggle={() => setIsDocPanelOpen(!isDocPanelOpen)}
        />
      </div>

      {/* ─── Responsive Upload Modal / Drawer ───
          Triggered from the orange header icon on mobile or desktop without navigating away. ─── */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchDocs}
      />
    </div>
  );
}
