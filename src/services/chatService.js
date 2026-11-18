import api, { API_BASE_URL } from './api';

export const chatService = {
  /**
   * Ask question synchronously
   * @param {string} question - User question
   * @param {string[]|null} documentIds - Optional document IDs to filter
   * @param {number} topK - Number of chunks to retrieve (default 4)
   * @param {boolean} includeSources - Include citation sources
   */
  async askQuestion(question, documentIds = null, topK = 4, includeSources = true) {
    const payload = {
      question,
      ...(documentIds && documentIds.length > 0 ? { document_ids: documentIds } : {}),
      top_k: topK,
      include_sources: includeSources,
    };

    const response = await api.post('/chat/ask', payload);
    const data = response.data;

    // Normalize response
    if (data?.data) {
      return data.data; // { answer, sources, question }
    }
    return data;
  },

  /**
   * Ask question with Server-Sent Events (SSE) streaming via fetch POST
   * @param {string} question
   * @param {string[]|null} documentIds
   * @param {number} topK
   * @param {Function} onChunk - Called for each chunk: (textDelta, sources) => void
   * @param {AbortSignal} [signal] - Optional abort signal
   */
  async askQuestionStream(question, documentIds = null, topK = 4, onChunk, signal) {
    const payload = {
      question,
      ...(documentIds && documentIds.length > 0 ? { document_ids: documentIds } : {}),
      top_k: topK,
      include_sources: true,
      stream: true,
    };

    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg;
      try {
        const parsed = JSON.parse(errorText);
        errorMsg = parsed.detail || parsed.message || `Server error: ${response.status}`;
      } catch {
        errorMsg = errorText || `HTTP error ${response.status}`;
      }
      throw new Error(errorMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedAnswer = '';
    let sources = [];
    let diagnostics = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep incomplete last line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // SSE format typically starts with "data: "
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'sources' && Array.isArray(parsed.sources)) {
                sources = parsed.sources;
                onChunk?.({ delta: '', fullText: accumulatedAnswer, sources, diagnostics });
              } else if (parsed.type === 'diagnostics' && parsed.diagnostics) {
                diagnostics = parsed.diagnostics;
                onChunk?.({ delta: '', fullText: accumulatedAnswer, sources, diagnostics });
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message || 'Streaming error');
              } else if (parsed.type === 'start' || parsed.type === 'done') {
                // ignore control events
              } else {
                const delta = parsed.content ?? parsed.chunk ?? parsed.delta ?? parsed.text ?? (typeof parsed.answer === 'string' ? parsed.answer : '');
                if (parsed.sources && Array.isArray(parsed.sources)) {
                  sources = parsed.sources;
                }
                if (parsed.diagnostics) {
                  diagnostics = parsed.diagnostics;
                }
                if (delta) {
                  accumulatedAnswer += delta;
                  onChunk?.({ delta, fullText: accumulatedAnswer, sources, diagnostics });
                }
              }
            } catch (err) {
              if (err instanceof Error && !/^Unexpected/.test(err.message || '')) {
                throw err;
              }
              // Raw string fallback
              accumulatedAnswer += dataStr;
              onChunk?.({ delta: dataStr, fullText: accumulatedAnswer, sources, diagnostics });
            }
          } else {
            // Direct text line streaming fallback
            accumulatedAnswer += trimmed + ' ';
            onChunk?.({ delta: trimmed + ' ', fullText: accumulatedAnswer, sources });
          }
        }
      }

      // Process any trailing buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr !== '[DONE]') {
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.chunk ?? parsed.delta ?? parsed.text ?? '';
              if (parsed.sources) sources = parsed.sources;
              if (delta) accumulatedAnswer += delta;
            } catch {
              accumulatedAnswer += dataStr;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      answer: accumulatedAnswer,
      sources,
      question,
    };
  },

  /**
   * Regenerate answer for a question (same as ask but can be used for versioning)
   * @param {string} question - User question
   * @param {string[]|null} documentIds - Optional document IDs to filter
   * @param {number} topK - Number of chunks to retrieve
   * @param {string} conversationId - Conversation ID for context
   */
  async regenerateAnswer(question, documentIds = null, topK = 4, conversationId = null) {
    const payload = {
      question,
      ...(documentIds && documentIds.length > 0 ? { document_ids: documentIds } : {}),
      top_k: topK,
      include_sources: true,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    };

    const response = await api.post('/chat/regenerate', payload);
    const data = response.data;

    if (data?.data) {
      return data.data;
    }
    return data;
  },

  /**
   * Get chat history from backend
   */
  async getChatHistory() {
    try {
      const response = await api.get('/chat/history');
      const data = response.data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.history)) return data.history;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.warn('Backend chat history endpoint not ready or empty:', err.message);
      // Fallback to localStorage history
      const localHistory = localStorage.getItem('rag_chat_history');
      return localHistory ? JSON.parse(localHistory) : [];
    }
  },

  /**
   * Delete a chat conversation
   */
  async deleteConversation(id) {
    try {
      const response = await api.delete(`/chat/history/${id}`);
      return response.data;
    } catch {
      // Local storage fallback
      const localHistory = localStorage.getItem('rag_chat_history');
      if (localHistory) {
        const parsed = JSON.parse(localHistory);
        const filtered = parsed.filter((item) => item.id !== id);
        localStorage.setItem('rag_chat_history', JSON.stringify(filtered));
      }
      return { success: true };
    }
  },

  /**
   * Check system health
   */
  async checkHealth() {
    try {
      const start = performance.now();
      const response = await api.get('/health', { timeout: 5000 });
      const duration = Math.round(performance.now() - start);
      return {
        healthy: response.status === 200,
        data: response.data,
        latencyMs: duration,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.userMessage || error.message,
        latencyMs: null,
      };
    }
  },
};

export default chatService;
