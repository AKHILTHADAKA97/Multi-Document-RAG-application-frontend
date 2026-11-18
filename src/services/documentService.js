import api from './api';

export const documentService = {
  /**
   * Upload multiple files with progress tracking and categorized error reporting.
   * @param {File[]} files
   * @param {Function} onProgress - (percent: number) => void
   */
  async uploadDocuments(files, onProgress) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      });

      return response.data;
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      const detailStr = String(detail || '').toLowerCase();
      let userMessage = 'Your document could not be saved. Please try again.';
      let category = 'Upload Error';

      if (
        status === 429 ||
        detailStr.includes('insufficient_quota') ||
        detailStr.includes('credit_balance_exhausted') ||
        detailStr.includes('waiting for available api credits') ||
        detailStr.includes('quota')
      ) {
        category = 'API Quota Notice';
        userMessage = 'Your document is safely stored. AI processing is waiting for available API credits.';
      } else if (status === 413) {
        category = 'File Size Limit Exceeded';
        userMessage = 'The uploaded file exceeds the maximum allowed size (50 MB).';
      } else if (status === 400 || status === 415 || status === 422) {
        category = 'Validation Error';
        if (detailStr.includes('supported') || detailStr.includes('extension') || detailStr.includes('format')) {
          userMessage = 'This file format is not supported for processing.';
        } else {
          userMessage = typeof detail === 'string' ? detail : 'Validation failed for the uploaded file.';
        }
      } else if (status >= 500) {
        category = 'Storage Failed';
        userMessage = 'Your document could not be saved. Please try again.';
      } else if (!err.response) {
        category = 'Network Offline';
        userMessage = 'Unable to reach the server. Please check your network connection.';
      }

      const enrichedError = new Error(userMessage);
      enrichedError.category = category;
      enrichedError.originalDetail = detail;
      enrichedError.response = err.response;
      throw enrichedError;
    }
  },

  /**
   * List uploaded documents with query filtering, sorting, and pagination.
   */
  async getDocuments(params = {}) {
    try {
      const response = await api.get('/documents', { params });
      const data = response.data;

      if (data?.documents) {
        return {
          documents: data.documents,
          total_count: data.total_count ?? data.documents.length,
          page: data.page ?? 1,
          page_size: data.page_size ?? 20,
        };
      }
      if (Array.isArray(data)) {
        return { documents: data, total_count: data.length, page: 1, page_size: data.length };
      }
      return { documents: [], total_count: 0, page: 1, page_size: 20 };
    } catch (err) {
      console.warn('Failed to fetch documents:', err.message);
      return { documents: [], total_count: 0, page: 1, page_size: 20 };
    }
  },

  /**
   * Fetch aggregated storage and processing statistics.
   */
  async getDocumentStats() {
    try {
      const response = await api.get('/documents/stats');
      return response.data;
    } catch (err) {
      console.warn('Failed to fetch stats:', err.message);
      return {
        total_documents: 0,
        total_storage_bytes: 0,
        processing_count: 0,
        failed_count: 0,
        ready_count: 0,
        waiting_credits_count: 0,
      };
    }
  },

  /**
   * Get single document details by ID.
   */
  async getDocument(id) {
    const response = await api.get(`/documents/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Get real-time status of document ingestion.
   */
  async getDocumentStatus(id) {
    const response = await api.get(`/documents/${id}/status`);
    return response.data;
  },

  /**
   * Rename a document's display filename.
   */
  async renameDocument(id, displayFilename) {
    const response = await api.patch(`/documents/${id}/rename`, {
      display_filename: displayFilename,
    });
    return response.data;
  },

  /**
   * Preview document text content and metadata.
   */
  async previewDocument(id) {
    const response = await api.get(`/documents/${id}/preview`);
    return response.data;
  },

  /**
   * Download original document file.
   */
  getDownloadUrl(id) {
    return `/api/v1/documents/${id}/download`;
  },

  /**
   * Trigger download via browser.
   */
  downloadDocument(id, filename) {
    const url = this.getDownloadUrl(id);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Update content of an editable document (TXT, JSON, CSV, MD, HTML).
   */
  async updateDocumentContent(id, content) {
    const response = await api.put(`/documents/${id}/content`, { content });
    return response.data;
  },

  /**
   * Replace a document with a new uploaded file.
   */
  async replaceDocument(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/documents/${id}/replace`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Trigger manual reprocessing of a document.
   */
  async reprocessDocument(id) {
    const response = await api.post(`/documents/${id}/reprocess`);
    return response.data;
  },

  /**
   * Get version history for document.
   */
  async getDocumentVersions(id) {
    const response = await api.get(`/documents/${id}/versions`);
    return response.data;
  },

  /**
   * Delete a single document by ID.
   */
  async deleteDocument(id) {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  /**
   * Bulk delete multiple documents.
   */
  async bulkDeleteDocuments(documentIds) {
    const response = await api.post('/documents/bulk-delete', {
      document_ids: documentIds,
    });
    return response.data;
  },
};

export default documentService;
