// ====================================
// SIMPLEFACT SDK - BUDGETS SERVICE
// Servicio para gestión de presupuestos
// ====================================

import type { AxiosInstance } from 'axios';
import type {
  Budget,
  BudgetData,
  BudgetUpdateData,
  BudgetStatus,
  ListParams,
  ApiResponse,
  ErrorCodes
} from '../types';
import { SimpleFACTError } from '../types';

export class BudgetsService {
  constructor(private http: AxiosInstance) {}

  /**
   * List all budgets with optional filtering and pagination
   */
  async list(params?: ListParams & {
    status?: BudgetStatus;
    client_id?: number;
    year?: number;
    month?: number;
    expired_only?: boolean;
  }): Promise<Budget[]> {
    try {
      const response = await this.http.get<ApiResponse<Budget[]>>('/budgets', { params });
      return response.data.data || [];
    } catch (error: any) {
      throw this.handleError(error, 'Failed to list budgets');
    }
  }

  /**
   * Get a specific budget by ID
   */
  async get(id: number): Promise<Budget> {
    try {
      const response = await this.http.get<ApiResponse<Budget>>(`/budgets/${id}`);
      if (!response.data.data) {
        throw new SimpleFACTError(
          `Budget with ID ${id} not found`,
          'BUDGET_NOT_FOUND' as keyof typeof ErrorCodes,
          404
        );
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to get budget ${id}`);
    }
  }

  /**
   * Create a new budget
   */
  async create(budgetData: BudgetData): Promise<Budget> {
    try {
      this.validateBudgetData(budgetData);

      const response = await this.http.post<ApiResponse<Budget>>('/budgets', budgetData);
      if (!response.data.data) {
        throw new SimpleFACTError(
          'Failed to create budget - no data returned',
          'API_ERROR' as keyof typeof ErrorCodes
        );
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create budget');
    }
  }

  /**
   * Update an existing budget
   */
  async update(id: number, budgetData: BudgetUpdateData): Promise<Budget> {
    try {
      if (Object.keys(budgetData).length === 0) {
        throw new SimpleFACTError(
          'No data provided for update',
          'MISSING_FIELD' as keyof typeof ErrorCodes
        );
      }

      const response = await this.http.put<ApiResponse<Budget>>(`/budgets/${id}`, budgetData);
      if (!response.data.data) {
        throw new SimpleFACTError(
          `Budget with ID ${id} not found`,
          'BUDGET_NOT_FOUND' as keyof typeof ErrorCodes,
          404
        );
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to update budget ${id}`);
    }
  }

  /**
   * Delete a budget
   */
  async delete(id: number): Promise<boolean> {
    try {
      await this.http.delete(`/budgets/${id}`);
      return true;
    } catch (error: any) {
      throw this.handleError(error, `Failed to delete budget ${id}`);
    }
  }

  /**
   * Approve a budget
   */
  async approve(id: number): Promise<Budget> {
    try {
      return await this.update(id, { status: 'approved' });
    } catch (error: any) {
      throw this.handleError(error, `Failed to approve budget ${id}`);
    }
  }

  /**
   * Reject a budget
   */
  async reject(id: number): Promise<Budget> {
    try {
      return await this.update(id, { status: 'rejected' });
    } catch (error: any) {
      throw this.handleError(error, `Failed to reject budget ${id}`);
    }
  }

  /**
   * Convert budget to invoice
   */
  async convertToInvoice(id: number): Promise<{ invoice_id: number; invoice_number: string }> {
    try {
      const response = await this.http.post<ApiResponse<{
        invoice_id: number;
        invoice_number: string;
      }>>(`/budgets/${id}/convert`);

      if (!response.data.data) {
        throw new SimpleFACTError(
          'Failed to convert budget to invoice',
          'API_ERROR' as keyof typeof ErrorCodes
        );
      }

      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to convert budget ${id} to invoice`);
    }
  }

  /**
   * Search budgets by number, client name, or description
   */
  async search(query: string, limit: number = 10): Promise<Budget[]> {
    try {
      const params = {
        search: query,
        limit: Math.min(limit, 100)
      };
      return await this.list(params);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to search budgets');
    }
  }

  /**
   * Get budgets by status
   */
  async getByStatus(status: BudgetStatus, limit: number = 50): Promise<Budget[]> {
    try {
      return await this.list({ status, limit });
    } catch (error: any) {
      throw this.handleError(error, `Failed to get budgets with status ${status}`);
    }
  }

  /**
   * Get pending budgets
   */
  async getPending(limit: number = 50): Promise<Budget[]> {
    try {
      return await this.getByStatus('pending', limit);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get pending budgets');
    }
  }

  /**
   * Get approved budgets
   */
  async getApproved(limit: number = 50): Promise<Budget[]> {
    try {
      return await this.getByStatus('approved', limit);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get approved budgets');
    }
  }

  /**
   * Get expired budgets
   */
  async getExpired(limit: number = 50): Promise<Budget[]> {
    try {
      return await this.list({ expired_only: true, limit });
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get expired budgets');
    }
  }

  /**
   * Get budgets for a specific client
   */
  async getByClient(clientId: number, limit: number = 50): Promise<Budget[]> {
    try {
      return await this.list({ client_id: clientId, limit });
    } catch (error: any) {
      throw this.handleError(error, `Failed to get budgets for client ${clientId}`);
    }
  }

  /**
   * Get budgets for a specific time period
   */
  async getByDateRange(
    dateFrom: string,
    dateTo: string,
    limit: number = 50
  ): Promise<Budget[]> {
    try {
      return await this.list({ start_date: dateFrom, end_date: dateTo, limit });
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get budgets by date range');
    }
  }

  /**
   * Get budget statistics
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    converted: number;
    totalAmount: number;
    pendingAmount: number;
    approvedAmount: number;
    conversionRate: number;
  }> {
    try {
      const budgets = await this.list({ limit: 1000 }); // Get more budgets for stats

      const stats = {
        total: budgets.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        expired: 0,
        converted: 0,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        conversionRate: 0
      };

      budgets.forEach(budget => {
        stats.totalAmount += budget.total || 0;

        switch (budget.status) {
          case 'pending':
            stats.pending++;
            stats.pendingAmount += budget.total || 0;
            break;
          case 'approved':
            stats.approved++;
            stats.approvedAmount += budget.total || 0;
            break;
          case 'rejected':
            stats.rejected++;
            break;
          case 'invoiced':
            stats.converted++;
            break;
          case 'expired':
            stats.expired++;
            break;
        }
      });

      // Calculate conversion rate
      if (stats.approved > 0) {
        stats.conversionRate = (stats.converted / stats.approved) * 100;
      }

      return stats;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get budget statistics');
    }
  }

  /**
   * Duplicate a budget
   */
  async duplicate(id: number, newClientId?: number): Promise<Budget> {
    try {
      const original = await this.get(id);

      const duplicateData: BudgetData = {
        client_id: newClientId || original.client?.id || original.client_id,
        issue_date: new Date().toISOString().split('T')[0], // Today's date
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        notes: original.notes ? `Duplicated from budget ${original.budget_number}. ${original.notes}` : `Duplicated from budget ${original.budget_number}`,
        items: original.items?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate
        })) || []
      };

      return await this.create(duplicateData);
    } catch (error: any) {
      throw this.handleError(error, `Failed to duplicate budget ${id}`);
    }
  }

  /**
   * Validate budget data before creation/update
   */
  private validateBudgetData(data: BudgetData | Partial<BudgetData>): void {
    if ('client_id' in data && (!data.client_id || data.client_id <= 0)) {
      throw new SimpleFACTError(
        'Valid client ID is required',
        'INVALID_CLIENT_ID' as keyof typeof ErrorCodes
      );
    }

    if ('issue_date' in data && data.issue_date) {
      const date = new Date(data.issue_date);
      if (isNaN(date.getTime())) {
        throw new SimpleFACTError(
          'Invalid issue_date format',
          'INVALID_ITEM' as keyof typeof ErrorCodes
        );
      }
    }

    if ('expiry_date' in data && data.expiry_date) {
      const expiryDate = new Date(data.expiry_date);
      if (isNaN(expiryDate.getTime())) {
        throw new SimpleFACTError(
          'Invalid expiry_date format',
          'INVALID_ITEM' as keyof typeof ErrorCodes
        );
      }

      if (data.issue_date) {
        const issueDate = new Date(data.issue_date);
        if (expiryDate <= issueDate) {
          throw new SimpleFACTError(
            'Expiry date must be after the issue date',
            'INVALID_ITEM' as keyof typeof ErrorCodes
          );
        }
      }
    }

    if ('items' in data && data.items) {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new SimpleFACTError(
          'At least one item is required',
          'NO_ITEMS' as keyof typeof ErrorCodes
        );
      }

      data.items.forEach((item, index) => {
        if (!item.description || item.description.trim().length === 0) {
          throw new SimpleFACTError(
            `Item ${index + 1}: Description is required`,
            'INVALID_ITEM' as keyof typeof ErrorCodes
          );
        }

        if (!item.quantity || item.quantity <= 0) {
          throw new SimpleFACTError(
            `Item ${index + 1}: Quantity must be greater than 0`,
            'INVALID_ITEM' as keyof typeof ErrorCodes
          );
        }

        if (item.unit_price === undefined || item.unit_price < 0) {
          throw new SimpleFACTError(
            `Item ${index + 1}: Unit price must be 0 or greater`,
            'INVALID_ITEM' as keyof typeof ErrorCodes
          );
        }
      });
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, defaultMessage: string): SimpleFACTError {
    if (error instanceof SimpleFACTError) {
      return error;
    }

    if (error.response) {
      const { status, data } = error.response;

      // Handle specific error codes
      if (status === 404) {
        return new SimpleFACTError(
          'Budget not found',
          'BUDGET_NOT_FOUND' as keyof typeof ErrorCodes,
          404
        );
      }

      if (status === 409 && data?.error?.code === 'BUDGET_ALREADY_INVOICED') {
        return new SimpleFACTError(
          'Budget has already been converted to an invoice',
          'BUDGET_ALREADY_INVOICED' as keyof typeof ErrorCodes,
          409,
          data.error.details
        );
      }

      return new SimpleFACTError(
        data?.error?.message || defaultMessage,
        data?.error?.code || ('API_ERROR' as keyof typeof ErrorCodes),
        status,
        data?.error?.details
      );
    }

    return new SimpleFACTError(
      defaultMessage,
      'API_ERROR' as keyof typeof ErrorCodes,
      0,
      { originalError: error }
    );
  }
}
