// ====================================
// SIMPLEFACT SDK - INVOICES SERVICE
// Servicio para gestión de facturas v115
// ====================================

import type {
  Invoice,
  InvoicesListParams,
  InvoiceStatusUpdate,
  InvoiceData,
  ApiResponse,
  ErrorCodes,
  DownloadOptions
} from '../types';
import { SimpleFACTError } from '../types';

export class InvoicesService {
  constructor(private client: any) {} // Accept SimpleFACTClient instead of AxiosInstance

  /**
   * Get all invoices with optional filters
   */
  async getAll(params: InvoicesListParams = {}): Promise<ApiResponse<Invoice[]>> {
    try {
      const response = await this.client.request({
        method: 'GET',
        url: '/api/v1/invoices',
        params
      });
      return response;
    } catch (error) {
      throw new SimpleFACTError(
        `Error fetching invoices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SERVER_ERROR' as keyof typeof ErrorCodes,
        500,
        error
      );
    }
  }

  /**
   * Get invoice by ID
   */
  async getById(id: number): Promise<ApiResponse<Invoice>> {
    try {
      const response = await this.client.request({
        method: 'GET',
        url: `/api/v1/invoices/${id}`
      });
      return response;
    } catch (error) {
      throw new SimpleFACTError(
        `Invoice with ID ${id} not found`,
        'NOT_FOUND_ERROR' as keyof typeof ErrorCodes,
        404,
        error
      );
    }
  }

  /**
   * Create new invoice
   */
  async create(invoiceData: InvoiceData): Promise<Invoice> {
    try {
      this.validateInvoiceData(invoiceData);

      const response = await this.client.request({
        method: 'POST',
        url: '/api/v1/invoices',
        data: invoiceData
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error creating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_ERROR' as keyof typeof ErrorCodes,
        400,
        error
      );
    }
  }

  /**
   * Update existing invoice
   */
  async update(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      if (updates.items && updates.items.length > 0) {
        this.validateItems(updates.items);
      }

      const response = await this.client.request({
        method: 'PUT',
        url: `/api/v1/invoices/${id}`,
        data: updates
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error updating invoice ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NOT_FOUND_ERROR' as keyof typeof ErrorCodes,
        404,
        error
      );
    }
  }

  /**
   * Delete invoice
   */
  async delete(id: number): Promise<void> {
    try {
      await this.client.request({
        method: 'DELETE',
        url: `/api/v1/invoices/${id}`
      });
    } catch (error) {
      throw new SimpleFACTError(
        `Error deleting invoice ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NOT_FOUND_ERROR' as keyof typeof ErrorCodes,
        404,
        error
      );
    }
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: number, statusUpdate: InvoiceStatusUpdate): Promise<Invoice> {
    try {
      const response = await this.client.request({
        method: 'PUT',
        url: `/api/v1/invoices/${id}/status`,
        data: statusUpdate
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error updating invoice status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NOT_FOUND_ERROR' as keyof typeof ErrorCodes,
        404,
        error
      );
    }
  }

  /**
   * Download invoice PDF
   */
  async downloadPDF(id: number, options: DownloadOptions = {}): Promise<Blob> {
    try {
      const response = await this.client.getHttpClient().request({
        method: 'GET',
        url: `/api/v1/invoices/${id}/pdf`,
        responseType: 'blob',
        params: options
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error downloading PDF for invoice ${id}`,
        'NOT_FOUND_ERROR' as keyof typeof ErrorCodes,
        404,
        error
      );
    }
  }

  /**
   * Download invoice XML
   */
  async downloadXML(id: number, options: DownloadOptions = {}): Promise<Blob> {
    try {
      const response = await this.client.getHttpClient().request({
        method: 'GET',
        url: `/api/v1/invoices/${id}/xml`,
        responseType: 'blob',
        params: options
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error downloading XML for invoice ${id}`,
        'NOT_FOUND_ERROR' as keyof typeof ErrorCodes,
        404,
        error
      );
    }
  }

  /**
   * Get invoices by status
   */
  async getByStatus(status: string, limit: number = 50): Promise<Invoice[]> {
    const response = await this.getAll({
      status: status as any,
      limit
    });
    return response.data || [];
  }

  /**
   * Get overdue invoices
   */
  async getOverdue(limit: number = 50): Promise<Invoice[]> {
    const response = await this.getAll({
      status: 'overdue',
      limit
    });
    return response.data || [];
  }

  /**
   * Get paid invoices
   */
  async getPaid(limit: number = 50): Promise<Invoice[]> {
    const response = await this.getAll({
      payment_status: 'paid',
      limit
    });
    return response.data || [];
  }

  /**
   * Get pending invoices
   */
  async getPending(limit: number = 50): Promise<Invoice[]> {
    const response = await this.getAll({
      payment_status: 'pending',
      limit
    });
    return response.data || [];
  }

  /**
   * Get invoices by date range
   */
  async getByDateRange(dateFrom: string, dateTo: string, limit: number = 100): Promise<Invoice[]> {
    const response = await this.getAll({
      start_date: dateFrom,
      end_date: dateTo,
      limit
    });
    return response.data || [];
  }

  /**
   * Get invoices for specific client
   */
  async getByClient(clientId: number, limit: number = 50): Promise<Invoice[]> {
    const response = await this.getAll({
      client_id: clientId,
      limit
    });
    return response.data || [];
  }

  /**
   * Search invoices by number or client name
   */
  async search(query: string, limit: number = 20): Promise<Invoice[]> {
    const response = await this.getAll({
      search: query,
      limit
    });
    return response.data || [];
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    averageAmount: number;
  }> {
    try {
      // Get all invoices for statistics (this could be optimized with a dedicated endpoint)
      const response = await this.getAll({ limit: 1000 });
      const invoices = response.data || [];

      const stats = {
        totalInvoices: invoices.length,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        averageAmount: 0
      };

      invoices.forEach(invoice => {
        const total = invoice.total || 0;
        stats.totalAmount += total;

        switch (invoice.status) {
          case 'paid':
            stats.paidAmount += total;
            break;
          case 'sent':
          case 'viewed':
            stats.pendingAmount += (invoice.remaining_amount || 0);
            break;
          case 'overdue':
            stats.overdueAmount += (invoice.remaining_amount || 0);
            break;
        }
      });

      stats.averageAmount = stats.totalInvoices > 0 ? stats.totalAmount / stats.totalInvoices : 0;

      return stats;
    } catch (error) {
      throw new SimpleFACTError(
        'Error calculating invoice statistics',
        'SERVER_ERROR' as keyof typeof ErrorCodes,
        500,
        error
      );
    }
  }

  // Validation methods
  private validateInvoiceData(data: InvoiceData): void {
    if (!data.client_id || typeof data.client_id !== 'number') {
      throw new SimpleFACTError(
        'Valid client ID is required',
        'VALIDATION_ERROR' as keyof typeof ErrorCodes
      );
    }

    if (!data.issue_date) {
      throw new SimpleFACTError(
        'Issue date is required',
        'VALIDATION_ERROR' as keyof typeof ErrorCodes
      );
    }

    if (!data.due_date) {
      throw new SimpleFACTError(
        'Due date is required',
        'VALIDATION_ERROR' as keyof typeof ErrorCodes
      );
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new SimpleFACTError(
        'At least one invoice item is required',
        'VALIDATION_ERROR' as keyof typeof ErrorCodes
      );
    }

    this.validateItems(data.items);
    this.validateDates(data.issue_date, data.due_date);
  }

  private validateItems(items: any[]): void {
    items.forEach((item, index) => {
      if (!item.description || typeof item.description !== 'string' || item.description.trim().length === 0) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Description is required`,
          'VALIDATION_ERROR' as keyof typeof ErrorCodes
        );
      }

      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Valid quantity is required`,
          'VALIDATION_ERROR' as keyof typeof ErrorCodes
        );
      }

      if (item.unit_price === undefined || typeof item.unit_price !== 'number' || item.unit_price < 0) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Valid unit price is required`,
          'VALIDATION_ERROR' as keyof typeof ErrorCodes
        );
      }

      if (item.tax_rate !== undefined && (typeof item.tax_rate !== 'number' || item.tax_rate < 0 || item.tax_rate > 100)) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Tax rate must be between 0 and 100`,
          'VALIDATION_ERROR' as keyof typeof ErrorCodes
        );
      }

      if (item.discount !== undefined && (typeof item.discount !== 'number' || item.discount < 0 || item.discount > 100)) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Discount must be between 0 and 100`,
          'VALIDATION_ERROR' as keyof typeof ErrorCodes
        );
      }
    });
  }

  private validateDates(issueDate: string, dueDate: string): void {
    const issue = new Date(issueDate);
    const due = new Date(dueDate);

    if (isNaN(issue.getTime())) {
      throw new SimpleFACTError(
        'Invalid issue date format',
        'VALIDATION_ERROR' as keyof typeof ErrorCodes
      );
    }

    if (isNaN(due.getTime())) {
      throw new SimpleFACTError(
        'Invalid due date format',
        'VALIDATION_ERROR' as keyof typeof ErrorCodes
      );
    }

    if (due < issue) {
      throw new SimpleFACTError(
        'Due date cannot be before issue date',
        'VALIDATION_ERROR' as keyof typeof ErrorCodes
      );
    }
  }
}
