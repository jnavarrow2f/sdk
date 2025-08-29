// ====================================
// SIMPLEFACT SDK - MAIN ENTRY POINT
// Exports para todo el SDK v115
// ====================================

// Export all types
export * from './types';

// Export services
export { BudgetsService } from './services/BudgetsService';
export { ClientPortalService } from './services/ClientPortalService';
export { InvoicesService } from './services/InvoicesService';
export { PaymentsService } from './services/PaymentsService';

// Export hooks
export * from './hooks';

// ====================================
// MAIN SDK CLIENT CLASS
// ====================================

import type { SimpleFACTConfig, SimpleFACTClient as ISimpleFACTClient, ApiResponse, HealthCheckResult } from './types';
import { BudgetsService } from './services/BudgetsService';
import { ClientPortalService } from './services/ClientPortalService';
import { InvoicesService } from './services/InvoicesService';
import { PaymentsService } from './services/PaymentsService';

// Mock axios for now - replace with actual implementation
const mockAxios = {
  create: () => ({
    get: () => Promise.resolve({ data: { data: [] } }),
    post: () => Promise.resolve({ data: { data: {} } }),
    put: () => Promise.resolve({ data: { data: {} } }),
    delete: () => Promise.resolve({ data: { success: true } }),
    request: () => Promise.resolve({ data: { data: [] } })
  })
};

export class SimpleFACTClient implements ISimpleFACTClient {
  public baseURL: string;
  public apiToken?: string;
  public timeout: number;
  public debug: boolean;
  public rateLimitPerHour: number;
  public autoRefreshToken: boolean;

  // Services
  public clients: any;
  public invoices: InvoicesService;
  public budgets: BudgetsService;
  public payments: PaymentsService;
  public verification: any;
  public clientPortal: ClientPortalService;

  private httpClient: any;

  constructor(config: SimpleFACTConfig) {
    this.baseURL = config.baseURL;
    this.apiToken = config.apiToken || config.apiKey;
    this.timeout = config.timeout || 30000;
    this.debug = config.debug || false;
    this.rateLimitPerHour = config.rateLimitPerHour || 1000;
    this.autoRefreshToken = config.autoRefreshToken !== false;

    // Initialize HTTP client
    this.httpClient = mockAxios.create();

    // Initialize services
    this.clients = {
      getAll: (params?: any) => this.get('/clients', { params }),
      getById: (id: number) => this.get(`/clients/${id}`),
      create: (data: any) => this.post('/clients', data),
      update: (id: number, data: any) => this.put(`/clients/${id}`, data),
      delete: (id: number) => this.delete(`/clients/${id}`)
    };

    this.invoices = new InvoicesService(this);
    this.budgets = new BudgetsService(this.httpClient);
    this.payments = new PaymentsService(this.httpClient);
    this.clientPortal = new ClientPortalService(this.httpClient);

    this.verification = {
      verifyInvoice: (hash: string) => this.get(`/verify/${hash}`)
    };
  }

  // HTTP methods
  async get<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    const result = await this.request({ method: 'GET', url, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const result = await this.request({ method: 'POST', url, data, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const result = await this.request({ method: 'PUT', url, data, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }

  async delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    const result = await this.request({ method: 'DELETE', url, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const result = await this.request({ method: 'PATCH', url, data, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }

  async request<T = any>(config: any): Promise<{ data: T; meta?: any }> {
    // Mock implementation
    return {
      data: [] as any,
      meta: {
        page: 1,
        per_page: 10,
        total: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false
      }
    };
  }

  getHttpClient(): any {
    return this.httpClient;
  }

  // Utility methods
  async refreshToken(): Promise<void> {
    // Mock implementation
    if (this.debug) {
      console.log('Token refreshed');
    }
  }

  async getHealthCheck(): Promise<HealthCheckResult> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        database: true,
        auth: true
      }
    };
  }

  getRateLimitInfo(): { limit: number; remaining: number; resetTime: Date; requestsThisHour: number } {
    return {
      limit: this.rateLimitPerHour,
      remaining: this.rateLimitPerHour - 1,
      resetTime: new Date(Date.now() + 3600000), // 1 hour from now
      requestsThisHour: 1
    };
  }
}

// Default export
export default SimpleFACTClient;
