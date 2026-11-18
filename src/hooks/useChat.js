import { useCallback } from 'react';
import { useChatContext } from '../context/ChatContext';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';

export function useChat() {
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    clearMessages,
    loadConversation,
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
  } = useChatContext();

  /**
   * Send question using regular POST /api/v1/chat/ask
   */
  const sendStandardMessage = useCallback(
    async (questionText, docIds = selectedDocuments) => {
      const trimmed = questionText.trim();
      if (!trimmed || isLoading) return;

      // 1. Add user message
      addMessage({
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      });

      // 2. Add empty assistant message placeholder
      const assistantMsgId = `assistant-${Date.now()}`;
      addMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        sources: [],
        timestamp: new Date().toISOString(),
      });

      setIsLoading(true);

      try {
        const response = await chatService.askQuestion(trimmed, docIds.length ? docIds : null, 4, true);

        const answerText = response.answer || response.response || 'No answer provided by the model.';
        const sources = response.sources || [];
        const diagnostics = response.diagnostics || null;

        updateMessage(assistantMsgId, {
          content: answerText,
          sources: sources,
          diagnostics: diagnostics,
        });
      } catch (err) {
        console.error('Error asking question:', err);
        const rawErrorText = err.userMessage || err.message || 'Failed to get an answer. Please check if the backend service is running.';
        const lower = rawErrorText.toLowerCase();
        let errorContent = `⚠️ **Error:** ${rawErrorText}`;
        if (lower.includes('credit') || lower.includes('quota') || lower.includes('429')) {
          errorContent =
            `⚠️ **AI API credits exhausted.**\n\n` +
            `Your documents are safely stored and indexed. However, the language model requires API credits to generate answers.\n\n` +
            `**Options to resolve:**\n` +
            `1. **Add OpenAI Credits**: Add billing credits at [platform.openai.com](https://platform.openai.com/settings/organization/billing/).\n` +
            `2. **Use Google Gemini (Free Tier)**: Set \`LLM_PROVIDER=google\` and add your \`GOOGLE_API_KEY\` in your backend \`.env\` file.`;
        }
        updateMessage(assistantMsgId, {
          content: errorContent,
          isError: true,
        });
        toast.error(lower.includes('quota') || lower.includes('credit') ? 'AI processing is waiting for available API credits.' : rawErrorText);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDocuments, isLoading, addMessage, updateMessage, setIsLoading]
  );

  /**
   * Stream message using SSE / ReadableStream with fallback to standard ask
   */
  const streamMessage = useCallback(
    async (questionText, docIds = selectedDocuments) => {
      const trimmed = questionText.trim();
      if (!trimmed || isLoading) return;

      // 1. Add user message
      addMessage({
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      });

      // 2. Add initial assistant placeholder
      const assistantMsgId = `assistant-${Date.now()}`;
      addMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        sources: [],
        timestamp: new Date().toISOString(),
      });

      setIsLoading(true);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await chatService.askQuestionStream(
          trimmed,
          docIds.length ? docIds : null,
          4,
          ({ delta, fullText, sources, diagnostics }) => {
            updateMessage(assistantMsgId, {
              content: fullText,
              ...(sources && sources.length > 0 ? { sources } : {}),
              ...(diagnostics ? { diagnostics } : {}),
            });
          },
          controller.signal
        );
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Stream aborted by user');
          return;
        }

        console.warn('Streaming failed or not supported, falling back to standard ask:', err.message);

        // Fallback to standard ask endpoint if stream failed before writing content
        try {
          const fallbackData = await chatService.askQuestion(trimmed, docIds.length ? docIds : null, 4, true);
          updateMessage(assistantMsgId, {
            content: fallbackData.answer || 'No response returned.',
            sources: fallbackData.sources || [],
          });
        } catch (fallbackErr) {
          const rawErrMsg = fallbackErr.userMessage || fallbackErr.message || err.message || 'Failed to connect to backend RAG service.';
          const lower = rawErrMsg.toLowerCase();
          let errorContent = `⚠️ **Error:** ${rawErrMsg}`;
          if (lower.includes('credit') || lower.includes('quota') || lower.includes('429')) {
            errorContent =
              `⚠️ **AI API credits exhausted.**\n\n` +
              `Your documents are safely stored and indexed. However, the language model requires API credits to generate answers.\n\n` +
              `**Options to resolve:**\n` +
              `1. **Add OpenAI Credits**: Add billing credits at [platform.openai.com](https://platform.openai.com/settings/organization/billing/).\n` +
              `2. **Use Google Gemini (Free Tier)**: Set \`LLM_PROVIDER=google\` and add your \`GOOGLE_API_KEY\` in your backend \`.env\` file.`;
          }
          updateMessage(assistantMsgId, {
            content: errorContent,
            isError: true,
          });
          toast.error(lower.includes('quota') || lower.includes('credit') ? 'AI processing is waiting for available API credits.' : rawErrMsg);
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [selectedDocuments, isLoading, addMessage, updateMessage, setIsLoading, setIsStreaming, abortControllerRef]
  );

  /**
   * Main send message dispatcher
   */
  const sendMessage = useCallback(
    (questionText) => {
      if (useStreamingMode) {
        return streamMessage(questionText);
      }
      return sendStandardMessage(questionText);
    },
    [useStreamingMode, streamMessage, sendStandardMessage]
  );

  return {
    messages,
    setMessages,
    sendMessage,
    streamMessage,
    clearChat: clearMessages,
    loadConversation,
    selectedDocuments,
    setSelectedDocuments,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
    isLoading,
    isStreaming,
    stopGeneration,
    useStreamingMode,
    setUseStreamingMode,
  };
}

export default useChat;
