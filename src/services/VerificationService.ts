// ====================================
// SIMPLEFACT SDK - VERIFICATION SERVICE
// Servicio para verificación pública de facturas
// ====================================

import { AxiosInstance } from 'axios';
import {
  InvoiceVerification,
  VerificationData,
  ApiResponse,
  SimpleFACTError,
  ErrorCodes
} from '../types';

export class VerificationService {
  constructor(private http: AxiosInstance) {}

  /**
   * Verify an invoice using its QR hash (basic verification)
   */
  async verifyBasic(hash: string): Promise<InvoiceVerification> {
    try {
      if (!hash || hash.trim().length === 0) {
        throw new SimpleFACTError(
          'Verification hash is required',
          ErrorCodes.MISSING_FIELD
        );
      }

      const response = await this.http.get<ApiResponse<InvoiceVerification>>(
        `/verify/${hash}`,
        {
          headers: {
            // Remove authorization header for public verification
            Authorization: undefined
          }
        }
      );

      if (!response.data.data) {
        throw new SimpleFACTError(
          'Invoice not found or verification failed',
          ErrorCodes.INVOICE_NOT_FOUND,
          404
        );
      }

      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to verify invoice');
    }
  }

  /**
   * Verify an invoice with additional validation data (detailed verification)
   */
  async verifyDetailed(
    hash: string,
    validationData: VerificationData
  ): Promise<InvoiceVerification> {
    try {
      if (!hash || hash.trim().length === 0) {
        throw new SimpleFACTError(
          'Verification hash is required',
          ErrorCodes.MISSING_FIELD
        );
      }

      const response = await this.http.post<ApiResponse<InvoiceVerification>>(
        `/verify/${hash}`,
        validationData,
        {
          headers: {
            // Remove authorization header for public verification
            Authorization: undefined
          }
        }
      );

      if (!response.data.data) {
        throw new SimpleFACTError(
          'Invoice not found or verification failed',
          ErrorCodes.INVOICE_NOT_FOUND,
          404
        );
      }

      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to verify invoice with validation');
    }
  }

  /**
   * Extract hash from QR code URL
   */
  extractHashFromQR(qrUrl: string): string | null {
    try {
      // Handle different QR URL formats
      const patterns = [
        /\/verify\/([a-zA-Z0-9]+)$/,           // /verify/hash
        /\/api\/v1\/verify\/([a-zA-Z0-9]+)$/,  // /api/v1/verify/hash
        /hash=([a-zA-Z0-9]+)/,                 // ?hash=hash
        /verificar\/([a-zA-Z0-9]+)$/           // /verificar/hash
      ];

      for (const pattern of patterns) {
        const match = qrUrl.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      // If no pattern matches, assume the entire string might be the hash
      if (/^[a-zA-Z0-9]+$/.test(qrUrl) && qrUrl.length >= 10) {
        return qrUrl;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify an invoice from QR code URL
   */
  async verifyFromQR(qrUrl: string, validationData?: VerificationData): Promise<InvoiceVerification> {
    try {
      const hash = this.extractHashFromQR(qrUrl);

      if (!hash) {
        throw new SimpleFACTError(
          'Invalid QR code URL - could not extract verification hash',
          ErrorCodes.INVALID_ITEM
        );
      }

      if (validationData) {
        return await this.verifyDetailed(hash, validationData);
      } else {
        return await this.verifyBasic(hash);
      }
    } catch (error: any) {
      throw this.handleError(error, 'Failed to verify invoice from QR');
    }
  }

  /**
   * Verify and validate invoice data
   */
  async verifyAndValidate(
    hash: string,
    expectedInvoiceNumber?: string,
    expectedTotal?: number,
    expectedClientTaxId?: string,
    expectedDate?: string
  ): Promise<{
    verification: InvoiceVerification;
    isValid: boolean;
    validationErrors: string[];
  }> {
    try {
      const validationData: VerificationData = {
        invoice_number: expectedInvoiceNumber,
        total: expectedTotal,
        client_tax_id: expectedClientTaxId,
        date: expectedDate,
        include_items: true
      };

      const verification = await this.verifyDetailed(hash, validationData);

      const validationErrors: string[] = verification.validation_errors || [];
      const isValid = verification.verified && validationErrors.length === 0;

      return {
        verification,
        isValid,
        validationErrors
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to verify and validate invoice');
    }
  }

  /**
   * Check if a hash format is valid
   */
  isValidHashFormat(hash: string): boolean {
    if (!hash || typeof hash !== 'string') {
      return false;
    }

    // Basic validation - hash should be alphanumeric and reasonable length
    return /^[a-zA-Z0-9]{10,}$/.test(hash);
  }

  /**
   * Create verification URL for sharing
   */
  createVerificationUrl(baseUrl: string, hash: string): string {
    try {
      if (!this.isValidHashFormat(hash)) {
        throw new SimpleFACTError(
          'Invalid hash format',
          ErrorCodes.INVALID_ITEM
        );
      }

      const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
      return `${cleanBaseUrl}/verificar/${hash}`;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create verification URL');
    }
  }

  /**
   * Get verification statistics (mock implementation)
   */
  async getVerificationStats(): Promise<{
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    successRate: number;
  }> {
    try {
      // This would require a backend endpoint to track verification stats
      // For now, return mock data
      return {
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        successRate: 0
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get verification statistics');
    }
  }

  /**
   * Validate verification data before sending
   */
  private validateVerificationData(data: VerificationData): void {
    if (data.total !== undefined && data.total < 0) {
      throw new SimpleFACTError(
        'Total amount cannot be negative',
        ErrorCodes.INVALID_AMOUNT
      );
    }

    if (data.date) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        throw new SimpleFACTError(
          'Invalid date format',
          ErrorCodes.INVALID_ITEM
        );
      }
    }

    if (data.invoice_number && data.invoice_number.trim().length === 0) {
      throw new SimpleFACTError(
        'Invoice number cannot be empty',
        ErrorCodes.INVALID_ITEM
      );
    }

    if (data.client_tax_id && data.client_tax_id.trim().length === 0) {
      throw new SimpleFACTError(
        'Client tax ID cannot be empty',
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
      if (status === 404) {
        return new SimpleFACTError(
          'Invoice not found or verification failed',
          ErrorCodes.INVOICE_NOT_FOUND,
          404
        );
      }

      if (status === 400) {
        return new SimpleFACTError(
          'Invalid verification data',
          ErrorCodes.INVALID_ITEM,
          400,
          data
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
