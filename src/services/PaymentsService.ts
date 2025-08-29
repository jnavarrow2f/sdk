// ====================================
// SIMPLEFACT SDK - PAYMENTS SERVICE
// Servicio para gestión de pagos
// ====================================

import type { AxiosInstance } from 'axios';
import type {
  Payment,
  PaymentData,
  PaymentMethod,
  ApiResponse,
  ErrorCodes
} from '../types';
import { SimpleFACTError } from '../types';

export class PaymentsService {
  constructor(private http: AxiosInstance) {}

  /**
   * List all payments for a specific invoice
   */
  async listByInvoice(invoiceId: number): Promise<{
    payments: Payment[];
    invoice: {
      id: number;
      invoice_number: string;
      total: number;
      total_paid: number;
      remaining_amount: number;
      payment_status: string;
    };
  }> {
    try {
      const response = await this.http.get<ApiResponse<Payment[]>>(`/invoices/${invoiceId}/payments`);

      const payments = response.data.data || [];

      // Create a mock invoice summary from the first payment if available
      const mockInvoice = payments.length > 0 ? {
        id: payments[0].invoice_id,
        invoice_number: `INV-${payments[0].invoice_id}`,
        total: payments.reduce((sum, p) => sum + p.amount, 0),
        total_paid: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
        remaining_amount: 0,
        payment_status: 'pending'
      } : {
        id: invoiceId,
        invoice_number: `INV-${invoiceId}`,
        total: 0,
        total_paid: 0,
        remaining_amount: 0,
        payment_status: 'pending'
      };

      return {
        payments,
        invoice: mockInvoice
      };
    } catch (error: any) {
      throw this.handleError(error, `Failed to list payments for invoice ${invoiceId}`);
    }
  }

  /**
   * Register a new payment for an invoice
   */
  async create(paymentData: PaymentData): Promise<{
    payment: Payment;
    invoice: {
      id: number;
      invoice_number: string;
      total: number;
      total_paid: number;
      remaining_amount: number;
      payment_status: string;
    };
  }> {
    try {
      this.validatePaymentData(paymentData);

      const response = await this.http.post<ApiResponse<Payment>>(`/invoices/${paymentData.invoice_id}/payments`, paymentData);

      if (!response.data.data) {
        throw new SimpleFACTError(
          'Failed to create payment - no data returned',
          'API_ERROR' as keyof typeof ErrorCodes
        );
      }

      const payment = response.data.data;

      // Create a mock invoice summary
      const mockInvoice = {
        id: payment.invoice_id,
        invoice_number: `INV-${payment.invoice_id}`,
        total: payment.amount, // This would be more accurate with real data
        total_paid: payment.amount,
        remaining_amount: 0,
        payment_status: 'paid'
      };

      return {
        payment,
        invoice: mockInvoice
      };
    } catch (error: any) {
      throw this.handleError(error, `Failed to create payment for invoice ${paymentData.invoice_id}`);
    }
  }

  /**
   * Update an existing payment
   */
  async update(
    invoiceId: number,
    paymentId: number,
    paymentData: Partial<PaymentData>
  ): Promise<boolean> {
    try {
      if (Object.keys(paymentData).length === 0) {
        throw new SimpleFACTError(
          'No data provided for update',
          'MISSING_FIELD' as keyof typeof ErrorCodes
        );
      }

      const updateData = {
        payment_id: paymentId,
        ...paymentData
      };

      await this.http.put(`/invoices/${invoiceId}/payments`, updateData);
      return true;
    } catch (error: any) {
      throw this.handleError(error, `Failed to update payment ${paymentId}`);
    }
  }

  /**
   * Delete a payment
   */
  async delete(invoiceId: number, paymentId: number): Promise<boolean> {
    try {
      await this.http.delete(`/invoices/${invoiceId}/payments?payment_id=${paymentId}`);
      return true;
    } catch (error: any) {
      throw this.handleError(error, `Failed to delete payment ${paymentId}`);
    }
  }

  /**
   * Get payment statistics for an invoice
   */
  async getInvoicePaymentStats(invoiceId: number): Promise<{
    totalPaid: number;
    remainingAmount: number;
    paymentCount: number;
    lastPaymentDate?: string;
    paymentMethods: { method: PaymentMethod; count: number; amount: number }[];
  }> {
    try {
      const { payments } = await this.listByInvoice(invoiceId);

      const stats = {
        totalPaid: 0,
        remainingAmount: 0,
        paymentCount: payments.length,
        lastPaymentDate: undefined as string | undefined,
        paymentMethods: [] as { method: PaymentMethod; count: number; amount: number }[]
      };

      // Calculate totals and find last payment
      let lastDate: Date | null = null;
      const methodStats = new Map<PaymentMethod, { count: number; amount: number }>();

      payments.forEach(payment => {
        stats.totalPaid += payment.amount;

        // Track last payment date
        const paymentDate = new Date(payment.payment_date);
        if (!lastDate || paymentDate > lastDate) {
          lastDate = paymentDate;
          stats.lastPaymentDate = payment.payment_date;
        }

        // Track payment methods
        const existing = methodStats.get(payment.payment_method) || { count: 0, amount: 0 };
        methodStats.set(payment.payment_method, {
          count: existing.count + 1,
          amount: existing.amount + payment.amount
        });
      });

      // Convert method stats to array
      stats.paymentMethods = Array.from(methodStats.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      }));

      return stats;
    } catch (error: any) {
      throw this.handleError(error, `Failed to get payment statistics for invoice ${invoiceId}`);
    }
  }

  /**
   * Register full payment for an invoice
   */
  async payInFull(
    invoiceId: number,
    paymentMethod: PaymentMethod = 'bank_transfer',
    reference?: string,
    notes?: string
  ): Promise<{
    payment: Payment;
    invoice: any;
  }> {
    try {
      // First get the invoice to know the remaining amount
      const invoice = await this.http.get(`/invoices/${invoiceId}`);
      const remainingAmount = invoice.data.data?.remaining_amount || 0;

      if (remainingAmount <= 0) {
        throw new SimpleFACTError(
          'Invoice is already fully paid',
          'INVALID_AMOUNT' as keyof typeof ErrorCodes
        );
      }

      const paymentData: PaymentData = {
        invoice_id: invoiceId,
        amount: remainingAmount,
        payment_date: new Date().toISOString().split('T')[0], // Today's date
        payment_method: paymentMethod,
        reference,
        notes: notes || 'Full payment'
      };

      return await this.create(paymentData);
    } catch (error: any) {
      throw this.handleError(error, `Failed to pay invoice ${invoiceId} in full`);
    }
  }

  /**
   * Get all payment methods used by a company
   */
  async getUsedPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      // This would require a backend endpoint, for now we return the common methods
      const commonMethods: PaymentMethod[] = [
        'bank_transfer',
        'cash',
        'credit_card',
        'check',
        'other'
      ];

      return commonMethods;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get payment methods');
    }
  }

  /**
   * Validate payment data before creation/update
   */
  private validatePaymentData(data: PaymentData | Partial<PaymentData>): void {
    if ('amount' in data && data.amount !== undefined) {
      if (data.amount <= 0) {
        throw new SimpleFACTError(
          'Payment amount must be greater than 0',
          'INVALID_AMOUNT' as keyof typeof ErrorCodes
        );
      }

      if (data.amount > 999999.99) {
        throw new SimpleFACTError(
          'Payment amount is too large',
          'INVALID_AMOUNT' as keyof typeof ErrorCodes
        );
      }
    }

    if ('payment_date' in data && data.payment_date) {
      const date = new Date(data.payment_date);
      if (isNaN(date.getTime())) {
        throw new SimpleFACTError(
          'Invalid payment date format',
          'INVALID_ITEM' as keyof typeof ErrorCodes
        );
      }

      // Check if date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (date > today) {
        throw new SimpleFACTError(
          'Payment date cannot be in the future',
          'INVALID_ITEM' as keyof typeof ErrorCodes
        );
      }
    }

    if ('payment_method' in data && data.payment_method) {
      const validMethods: PaymentMethod[] = [
        'cash', 'bank_transfer', 'credit_card', 'check', 'other'
      ];

      if (!validMethods.includes(data.payment_method)) {
        throw new SimpleFACTError(
          `Invalid payment method. Valid methods: ${validMethods.join(', ')}`,
          'INVALID_ITEM' as keyof typeof ErrorCodes
        );
      }
    }

    if (data.reference && data.reference.length > 100) {
      throw new SimpleFACTError(
        'Payment reference is too long (max 100 characters)',
        'INVALID_ITEM' as keyof typeof ErrorCodes
      );
    }

    if (data.notes && data.notes.length > 500) {
      throw new SimpleFACTError(
        'Payment notes are too long (max 500 characters)',
        'INVALID_ITEM' as keyof typeof ErrorCodes
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
      if (status === 404) {
        if (data?.error?.code === 'INVOICE_NOT_FOUND') {
          return new SimpleFACTError(
            'Invoice not found',
            'INVOICE_NOT_FOUND' as keyof typeof ErrorCodes,
            404
          );
        }
        return new SimpleFACTError(
          'Payment not found',
          'PAYMENT_NOT_FOUND' as keyof typeof ErrorCodes,
          404
        );
      }

      if (status === 409 && data?.error?.code === 'PAYMENT_EXCEEDS_REMAINING') {
        return new SimpleFACTError(
          'Payment amount exceeds remaining invoice amount',
          'PAYMENT_EXCEEDS_REMAINING' as keyof typeof ErrorCodes,
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
