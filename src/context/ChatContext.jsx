import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';

const ChatContext = createContext(null);

const STORAGE_KEY_CONVERSATIONS = 'rag_conversations_v2';
const STORAGE_KEY_ACTIVE_CONV_ID = 'rag_active_conversation_id';

const generateId = () => `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export function ChatProvider({ children }) {
  // 1. All saved conversations state (persisted)
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Active conversation ID
  const [activeConversationId, setActiveConversationId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_CONV_ID) || null;
  });

  // 3. Current active conversation messages
  const [messages, setMessages] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useStreamingMode, setUseStreamingMode] = useState(true);
  const abortControllerRef = useRef(null);

  // Sync conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.warn('Failed saving conversations to storage:', e);
    }
  }, [conversations]);

  // Sync active ID to localStorage
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CONV_ID, activeConversationId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CONV_ID);
    }
  }, [activeConversationId]);

  // When activeConversationId changes, load its messages
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const found = conversations.find((c) => c.id === activeConversationId);
    if (found) {
      setMessages(found.messages || []);
      if (found.selectedDocuments) {
        setSelectedDocuments(found.selectedDocuments);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  /**
   * Action: Start a brand-new chat
   * Creates a fresh session, clears the active view immediately, sets a new unique ID.
   */
  const startNewChat = useCallback(() => {
    // If generation is running, abort it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }

    const newConvId = generateId();
    setActiveConversationId(newConvId);
    setMessages([]);
    toast.success('Started new chat', { id: 'new-chat-toast', duration: 2000 });
  }, []);

  /**
   * Add a message and automatically save / update the conversation in state and backend
   */
  const addMessage = useCallback((message) => {
    const newMsg = {
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: message.role || 'user',
      content: message.content || '',
      sources: message.sources || [],
      timestamp: message.timestamp || new Date().toISOString(),
      ...message,
    };

    setMessages((prev) => {
      const updatedMessages = [...prev, newMsg];

      // Auto-save/update in conversations list
      setActiveConversationId((currentId) => {
        const targetId = currentId || generateId();

        setConversations((prevConvs) => {
          const existingIdx = prevConvs.findIndex((c) => c.id === targetId);
          const firstUserMsg = updatedMessages.find((m) => m.role === 'user');
          const title = firstUserMsg
            ? firstUserMsg.content.slice(0, 50).trim()
            : 'New Conversation';

          const convRecord = {
            id: targetId,
            title: title || 'New Conversation',
            timestamp: new Date().toISOString(),
            messages: updatedMessages,
            selectedDocuments,
            pinned: existingIdx >= 0 ? prevConvs[existingIdx].pinned : false,
          };

          if (existingIdx >= 0) {
            const next = [...prevConvs];
            next[existingIdx] = { ...next[existingIdx], ...convRecord };
            return next;
          } else {
            return [convRecord, ...prevConvs];
          }
        });

        return targetId;
      });

      return updatedMessages;
    });

    return newMsg;
  }, [selectedDocuments]);

  /**
   * Update a specific message (for streaming token accumulation)
   */
  const updateMessage = useCallback((id, updates) => {
    setMessages((prev) => {
      const nextMessages = prev.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      );

      // Keep active conversation messages in sync
      setConversations((prevConvs) =>
        prevConvs.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: nextMessages, timestamp: new Date().toISOString() }
            : conv
        )
      );

      return nextMessages;
    });
  }, [activeConversationId]);

  /**
   * Regenerate an assistant answer by re-running the RAG pipeline
   */
  const regenerateMessage = useCallback(async (assistantMsgId, docIds = selectedDocuments) => {
    if (isLoading) return;

    // Find the user question that preceded this answer
    const msgIndex = messages.findIndex(m => m.id === assistantMsgId);
    const userMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
    
    if (!userMsg || userMsg.role !== 'user') {
      toast.error('Cannot find original question to regenerate');
      return;
    }

    setIsLoading(true);

    try {
      const response = await chatService.regenerateAnswer(
        userMsg.content,
        docIds.length ? docIds : null,
        4,
        activeConversationId
      );

      updateMessage(assistantMsgId, {
        content: response.answer,
        sources: response.sources || [],
        diagnostics: response.diagnostics || null,
      });
      
      toast.success('Answer regenerated');
    } catch (err) {
      console.error('Regenerate error:', err);
      toast.error(err.message || 'Failed to regenerate answer');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [messages, selectedDocuments, activeConversationId, isLoading, updateMessage, setIsLoading]);

  /**
   * Open an existing conversation from sidebar
   */
  const openConversation = useCallback((convId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }
    setActiveConversationId(convId);
    const found = conversations.find((c) => c.id === convId);
    if (found) {
      setMessages(found.messages || []);
      if (found.selectedDocuments) {
        setSelectedDocuments(found.selectedDocuments);
      }
    }
  }, [conversations]);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (convId) => {
    try {
      await chatService.deleteConversation(convId);
    } catch (e) {
      console.warn('Backend delete error (using local removal):', e);
    }

    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setActiveConversationId((current) => {
      if (current === convId) {
        setMessages([]);
        return null;
      }
      return current;
    });
    toast.success('Conversation removed');
  }, []);

  /**
   * Pin or unpin a conversation
   */
  const togglePinConversation = useCallback((convId) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, pinned: !c.pinned } : c))
    );
  }, []);

  /**
   * Rename a conversation title
   */
  const renameConversation = useCallback((convId, newTitle) => {
    if (!newTitle.trim()) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle.trim() } : c))
    );
    toast.success('Conversation renamed');
  }, []);

  // Document selection handlers
  const toggleDocumentSelection = useCallback((docId) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  }, []);

  const selectAllDocuments = useCallback((allIds) => {
    setSelectedDocuments(allIds);
  }, []);

  const clearDocumentSelection = useCallback(() => {
    setSelectedDocuments([]);
  }, []);

  // Stop ongoing streaming / generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    toast('Generation stopped', { icon: '⏹️' });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        activeConversationId,
        conversations,
        startNewChat,
        openConversation,
        deleteConversation,
        togglePinConversation,
        renameConversation,
        clearChat: startNewChat,
        addMessage,
        updateMessage,
        regenerateMessage,
        selectedDocuments,
        setSelectedDocuments,
        toggleDocumentSelection,
        selectAllDocuments,
        clearDocumentSelection,
        isLoading,
        setIsLoading,
        isStreaming,
        setIsStreaming,
        useStreamingMode,
        setUseStreamingMode,
        stopGeneration,
        abortControllerRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    return {
      messages: [],
      setMessages: () => {},
      activeConversationId: null,
      conversations: [],
      startNewChat: () => {},
      openConversation: () => {},
      deleteConversation: () => {},
      togglePinConversation: () => {},
      renameConversation: () => {},
      clearChat: () => {},
      addMessage: () => {},
      updateMessage: () => {},
      regenerateMessage: () => {},
      selectedDocuments: [],
      setSelectedDocuments: () => {},
      toggleDocumentSelection: () => {},
      selectAllDocuments: () => {},
      clearDocumentSelection: () => {},
      isLoading: false,
      setIsLoading: () => {},
      isStreaming: false,
      setIsStreaming: () => {},
      useStreamingMode: true,
      setUseStreamingMode: () => {},
      stopGeneration: () => {},
      abortControllerRef: { current: null },
    };
  }
  return context;
}

export default ChatContext;
