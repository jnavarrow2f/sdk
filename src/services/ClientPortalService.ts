// ====================================
// SIMPLEFACT SDK - CLIENT PORTAL SERVICE
// Servicio para portal de clientes
// ====================================

import { AxiosInstance } from 'axios';
import {
  ClientProfile,
  ClientProfileUpdateData,
  PasswordChangeData,
  Invoice,
  Budget,
  ListParams,
  ApiResponse,
  SimpleFACTError,
  ErrorCodes
} from '../types';

export class ClientPortalService {
  constructor(private http: AxiosInstance) {}

  /**
   * Get client profile information
   */
  async getProfile(): Promise<ClientProfile> {
    try {
      const response = await this.http.get<ApiResponse<ClientProfile>>('/client/profile');

      if (!response.data.data) {
        throw new SimpleFACTError(
          'Client profile not found or access denied',
          ErrorCodes.CLIENT_NOT_FOUND,
          404
        );
      }

      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get client profile');
    }
  }

  /**
   * Update client profile information
   */
  async updateProfile(profileData: ClientProfileUpdateData): Promise<boolean> {
    try {
      this.validateProfileData(profileData);

      await this.http.put('/client/profile', profileData);
      return true;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to update client profile');
    }
  }

  /**
   * Change client password
   */
  async changePassword(passwordData: PasswordChangeData): Promise<boolean> {
    try {
      this.validatePasswordData(passwordData);

      await this.http.post('/client/change-password', passwordData);
      return true;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to change password');
    }
  }

  /**
   * Get client's invoices
   */
  async getInvoices(params?: ListParams & {
    status?: string;
    year?: number;
    month?: number;
  }): Promise<{
    invoices: Invoice[];
    statistics: {
      total_invoices: number;
      total_paid: number;
      total_pending: number;
      total_overdue: number;
      total_amount: number;
      average_amount: number;
    };
  }> {
    try {
      const response = await this.http.get<ApiResponse<Invoice[]>>('/client/invoices', { params });

      if (!response.data.data) {
        return {
          invoices: [],
          statistics: {
            total_invoices: 0,
            total_paid: 0,
            total_pending: 0,
            total_overdue: 0,
            total_amount: 0,
            average_amount: 0
          }
        };
      }

      const invoices = response.data.data || [];

      // Calculate statistics from the invoices data
      const statistics = {
        total_invoices: invoices.length,
        total_paid: invoices.filter(inv => inv.status === 'paid').length,
        total_pending: invoices.filter(inv => ['sent', 'viewed'].includes(inv.status)).length,
        total_overdue: invoices.filter(inv => inv.status === 'overdue').length,
        total_amount: invoices.reduce((sum, inv) => sum + inv.total, 0),
        average_amount: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0
      };

      return {
        invoices,
        statistics
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get client invoices');
    }
  }

  /**
   * Get client's budgets
   */
  async getBudgets(params?: ListParams & {
    status?: string;
  }): Promise<{
    budgets: Budget[];
    statistics: {
      total_budgets: number;
      total_approved: number;
      total_pending: number;
      total_rejected: number;
      total_converted: number;
      expired_budgets: number;
      recent: {
        count: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.http.get<ApiResponse<Budget[]>>('/client/budgets', { params });

      if (!response.data.data) {
        return {
          budgets: [],
          statistics: {
            total_budgets: 0,
            total_approved: 0,
            total_pending: 0,
            total_rejected: 0,
            total_converted: 0,
            expired_budgets: 0,
            recent: { count: 0, total: 0 }
          }
        };
      }

      const budgets = response.data.data || [];

      // Calculate statistics from the budgets data
      const statistics = {
        total_budgets: budgets.length,
        total_approved: budgets.filter(budget => budget.status === 'approved').length,
        total_pending: budgets.filter(budget => budget.status === 'pending').length,
        total_rejected: budgets.filter(budget => budget.status === 'rejected').length,
        total_converted: budgets.filter(budget => budget.status === 'invoiced').length,
        expired_budgets: budgets.filter(budget => budget.status === 'expired').length,
        recent: {
          count: budgets.slice(0, 5).length,
          total: budgets.slice(0, 5).reduce((sum, budget) => sum + (budget.total || 0), 0)
        }
      };

      return {
        budgets,
        statistics
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get client budgets');
    }
  }

  /**
   * Download document PDF (invoice or budget)
   */
  async downloadDocument(
    documentId: number,
    type: 'invoice' | 'budget'
  ): Promise<Blob> {
    try {
      const response = await this.http.get(
        `/client/documents/${documentId}/pdf?type=${type}`,
        { responseType: 'blob' }
      );

      return response.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to download ${type} PDF`);
    }
  }

  /**
   * Get pending invoices for client
   */
  async getPendingInvoices(): Promise<Invoice[]> {
    try {
      const { invoices } = await this.getInvoices({ status: 'pending', limit: 50 });
      return invoices;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get pending invoices');
    }
  }

  /**
   * Get paid invoices for client
   */
  async getPaidInvoices(limit: number = 20): Promise<Invoice[]> {
    try {
      const { invoices } = await this.getInvoices({ status: 'paid', limit });
      return invoices;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get paid invoices');
    }
  }

  /**
   * Get overdue invoices for client
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    try {
      const { invoices } = await this.getInvoices({ status: 'overdue', limit: 50 });
      return invoices;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get overdue invoices');
    }
  }

  /**
   * Get recent activity (invoices and budgets)
   */
  async getRecentActivity(limit: number = 10): Promise<{
    invoices: Invoice[];
    budgets: Budget[];
  }> {
    try {
      const [invoicesResult, budgetsResult] = await Promise.all([
        this.getInvoices({ limit: Math.ceil(limit / 2), sort_by: 'created_at', sort_direction: 'desc' }),
        this.getBudgets({ limit: Math.ceil(limit / 2), sort_by: 'created_at', sort_direction: 'desc' })
      ]);

      return {
        invoices: invoicesResult.invoices,
        budgets: budgetsResult.budgets
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get recent activity');
    }
  }

  /**
   * Get client dashboard summary
   */
  async getDashboardSummary(): Promise<{
    profile: ClientProfile;
    pendingInvoices: Invoice[];
    recentBudgets: Budget[];
    statistics: {
      totalInvoices: number;
      totalBudgets: number;
      totalPaid: number;
      totalPending: number;
    };
  }> {
    try {
      const [profile, invoicesResult, budgetsResult] = await Promise.all([
        this.getProfile(),
        this.getInvoices({ limit: 5, sort_by: 'created_at', sort_direction: 'desc' }),
        this.getBudgets({ limit: 5, sort_by: 'created_at', sort_direction: 'desc' })
      ]);

      return {
        profile,
        pendingInvoices: invoicesResult.invoices.filter(inv => inv.status === 'sent' || inv.status === 'viewed'),
        recentBudgets: budgetsResult.budgets,
        statistics: {
          totalInvoices: invoicesResult.statistics.total_invoices,
          totalBudgets: budgetsResult.statistics.total_budgets,
          totalPaid: invoicesResult.statistics.total_paid,
          totalPending: invoicesResult.statistics.total_pending
        }
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get dashboard summary');
    }
  }

  /**
   * Search client's documents
   */
  async searchDocuments(
    query: string,
    type?: 'invoices' | 'budgets' | 'all'
  ): Promise<{
    invoices: Invoice[];
    budgets: Budget[];
  }> {
    try {
      const searchParams = { search: query, limit: 20 };

      if (type === 'invoices') {
        const invoicesResult = await this.getInvoices(searchParams);
        return { invoices: invoicesResult.invoices, budgets: [] };
      }

      if (type === 'budgets') {
        const budgetsResult = await this.getBudgets(searchParams);
        return { invoices: [], budgets: budgetsResult.budgets };
      }

      // Search both if type is 'all' or not specified
      const [invoicesResult, budgetsResult] = await Promise.all([
        this.getInvoices(searchParams),
        this.getBudgets(searchParams)
      ]);

      return {
        invoices: invoicesResult.invoices,
        budgets: budgetsResult.budgets
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to search documents');
    }
  }

  /**
   * Validate profile update data
   */
  private validateProfileData(data: ClientProfileUpdateData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new SimpleFACTError(
        'Name is required and cannot be empty',
        ErrorCodes.MISSING_FIELD
      );
    }

    if (data.name.length > 200) {
      throw new SimpleFACTError(
        'Name is too long (max 200 characters)',
        ErrorCodes.INVALID_ITEM
      );
    }

    if (data.phone && data.phone.length > 20) {
      throw new SimpleFACTError(
        'Phone number is too long (max 20 characters)',
        ErrorCodes.INVALID_ITEM
      );
    }

    if (data.address && data.address.length > 500) {
      throw new SimpleFACTError(
        'Address is too long (max 500 characters)',
        ErrorCodes.INVALID_ITEM
      );
    }

    if (data.postal_code && !/^\d{5}$/.test(data.postal_code)) {
      throw new SimpleFACTError(
        'Postal code must be 5 digits',
        ErrorCodes.INVALID_ITEM
      );
    }
  }

  /**
   * Validate password change data
   */
  private validatePasswordData(data: PasswordChangeData): void {
    if (!data.current_password) {
      throw new SimpleFACTError(
        'Current password is required',
        ErrorCodes.MISSING_FIELD
      );
    }

    if (!data.new_password) {
      throw new SimpleFACTError(
        'New password is required',
        ErrorCodes.MISSING_FIELD
      );
    }

    if (data.new_password !== data.confirm_password) {
      throw new SimpleFACTError(
        'New password and confirmation do not match',
        ErrorCodes.INVALID_ITEM
      );
    }

    if (data.new_password.length < 8) {
      throw new SimpleFACTError(
        'New password must be at least 8 characters long',
        ErrorCodes.INVALID_ITEM
      );
    }

    if (data.current_password === data.new_password) {
      throw new SimpleFACTError(
        'New password must be different from current password',
        ErrorCodes.INVALID_ITEM
      );
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
      if (status === 403) {
        return new SimpleFACTError(
          'Access denied. Client portal access not enabled.',
          ErrorCodes.INSUFFICIENT_PERMISSIONS,
          403
        );
      }

      if (status === 404) {
        return new SimpleFACTError(
          'Client not found or access not enabled',
          ErrorCodes.CLIENT_NOT_FOUND,
          404
        );
      }

      if (status === 400 && data?.error?.code === 'EMAIL_MODIFICATION_NOT_ALLOWED') {
        return new SimpleFACTError(
          'Email modification is not allowed. Contact your company for email changes.',
          ErrorCodes.INVALID_ITEM,
          400
        );
      }

      return new SimpleFACTError(
        data?.error?.message || defaultMessage,
        data?.error?.code || ErrorCodes.API_ERROR,
        status,
        data?.error?.details
      );
    }

    return new SimpleFACTError(
      defaultMessage,
      ErrorCodes.API_ERROR,
      0,
      { originalError: error }
    );
  }
}
