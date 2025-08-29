// ====================================
// SIMPLEFACT SDK - MAIN CLIENT
// Cliente principal para la API REST v115
// ====================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {
  SimpleFACTConfig,
  ApiResponse,
  SimpleFACTError,
  ErrorCodes,
  RateLimitInfo,
  HealthCheckResult
} from '../types';
import { ClientsService } from '../services/ClientsService';
import { BudgetsService } from '../services/BudgetsService';
import { InvoicesService } from '../services/InvoicesService';
import { PaymentsService } from '../services/PaymentsService';
import { VerificationService } from '../services/VerificationService';
import { ClientPortalService } from '../services/ClientPortalService';

/**
 * Main SimpleFact API client with advanced features
 */
export class SimpleFACTClient {
  private http: AxiosInstance;
  private config: SimpleFACTConfig;
  private apiToken?: string;
  private tokenExpiration?: Date;
  private refreshPromise?: Promise<void>;
  private requestCount: number = 0;
  private requestsThisHour: number = 0;
  private hourlyResetTime: number = Date.now() + 3600000; // 1 hour from now

  // Public properties for compatibility
  public readonly baseURL: string;
  public readonly timeout: number;
  public readonly debug: boolean;
  public readonly rateLimitPerHour: number;
  public readonly autoRefreshToken: boolean;

  // Service instances
  public readonly clients: ClientsService;
  public readonly budgets: BudgetsService;
  public readonly invoices: InvoicesService;
  public readonly payments: PaymentsService;
  public readonly verification: VerificationService;
  public readonly clientPortal: ClientPortalService;

  constructor(config: SimpleFACTConfig) {
    this.config = {
      timeout: 30000,
      rateLimitPerHour: 1000,
      debug: false,
      retryAttempts: 3,
      retryDelay: 1000,
      autoRefreshToken: true,
      ...config
    };

    // Set public properties
    this.baseURL = this.config.baseURL;
    this.timeout = this.config.timeout!;
    this.debug = this.config.debug!;
    this.rateLimitPerHour = this.config.rateLimitPerHour!;
    this.autoRefreshToken = this.config.autoRefreshToken!;

    // Set API token from config
    this.apiToken = config.apiToken || config.apiKey;

    // Initialize HTTP client
    this.http = this.createHttpClient();

    // Initialize services - pass the HTTP client instead of 'this'
    this.clients = new ClientsService(this.http);
    this.budgets = new BudgetsService(this.http);
    this.invoices = new InvoicesService(this.http);
    this.payments = new PaymentsService(this.http);
    this.verification = new VerificationService(this.http);
    this.clientPortal = new ClientPortalService(this.http);
  }

  // ====================================
  // HTTP METHODS - Expose for services
  // ====================================

  /**
   * GET request
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest('GET', url, undefined, config);
  }

  /**
   * POST request
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest('POST', url, data, config);
  }

  /**
   * PUT request
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest('PUT', url, data, config);
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest('DELETE', url, undefined, config);
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest('PATCH', url, data, config);
  }

  // ====================================
  // CORE REQUEST METHOD
  // ====================================

  /**
   * Make HTTP request with error handling and retries
   */
  private async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      let response: AxiosResponse<ApiResponse<T>>;

      switch (method) {
        case 'GET':
          response = await this.http.get(url, config);
          break;
        case 'POST':
          response = await this.http.post(url, data, config);
          break;
        case 'PUT':
          response = await this.http.put(url, data, config);
          break;
        case 'DELETE':
          response = await this.http.delete(url, config);
          break;
        case 'PATCH':
          response = await this.http.patch(url, data, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response.data;
    } catch (error) {
      // Retry logic for failed requests
      const isRetryable = this.isRetryableError(error);
      const shouldRetry = attempt < (this.config.retryAttempts || 3) && isRetryable;

      if (shouldRetry) {
        if (this.config.debug) {
          console.log(`[SimpleFact SDK] Retrying request (attempt ${attempt + 1}/${this.config.retryAttempts})`);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, (this.config.retryDelay || 1000) * attempt));

        return this.makeRequest<T>(method, url, data, config, attempt + 1);
      }

      throw this.handleError(error);
    }
  }

  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `SimpleFact-SDK/1.0.0 (JavaScript)`,
      },
    });

    // Request interceptor
    client.interceptors.request.use(
      async (config) => {
        // Rate limiting check
        this.checkRateLimit();

        // Auto-refresh token if needed
        if (this.config.autoRefreshToken && this.shouldRefreshToken()) {
          await this.refreshToken();
        }

        // Add authorization header
        if (this.apiToken) {
          config.headers.Authorization = `Bearer ${this.apiToken}`;
        }

        // Debug logging
        if (this.config.debug) {
          console.log(`[SimpleFact SDK] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        this.incrementRequestCount();

        // Update rate limit info from headers
        this.updateRateLimitInfo(response);

        if (this.config.debug) {
          console.log(`[SimpleFact SDK] Response ${response.status}:`, response.data);
        }

        return response;
      },
      async (error: AxiosError) => {
        this.incrementRequestCount();

        // Handle 401 unauthorized - token might be expired
        if (error.response?.status === 401 && this.config.autoRefreshToken) {
          const originalRequest = error.config;

          // Avoid infinite loops
          if (!originalRequest || (originalRequest as any)._retry) {
            return Promise.reject(this.handleError(error));
          }

          try {
            (originalRequest as any)._retry = true;
            await this.refreshToken();

            // Retry original request with new token
            if (originalRequest.headers && this.apiToken) {
              originalRequest.headers.Authorization = `Bearer ${this.apiToken}`;
            }

            return client.request(originalRequest);
          } catch (refreshError) {
            return Promise.reject(this.handleError(refreshError));
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );

    return client;
  }

  private checkRateLimit(): void {
    const now = Date.now();

    // Reset hourly counter if needed
    if (now > this.hourlyResetTime) {
      this.requestsThisHour = 0;
      this.hourlyResetTime = now + 3600000;
    }

    // Check if we're hitting rate limits
    if (this.requestsThisHour >= this.config.rateLimitPerHour!) {
      const error = new Error('Rate limit exceeded. Please wait before making more requests.') as SimpleFACTError;
      error.code = ErrorCodes.RATE_LIMIT_EXCEEDED;
      error.statusCode = 429;
      error.details = {
        limit: this.config.rateLimitPerHour,
        resetTime: new Date(this.hourlyResetTime).toISOString()
      };
      throw error;
    }
  }

  private incrementRequestCount(): void {
    this.requestCount++;
    this.requestsThisHour++;
  }

  private updateRateLimitInfo(response: AxiosResponse): void {
    const headers = response.headers;

    if (headers['x-ratelimit-limit']) {
      this.config.rateLimitPerHour = parseInt(headers['x-ratelimit-limit']);
    }

    if (headers['x-ratelimit-remaining']) {
      const remaining = parseInt(headers['x-ratelimit-remaining']);
      this.requestsThisHour = this.config.rateLimitPerHour! - remaining;
    }

    if (headers['x-ratelimit-reset']) {
      this.hourlyResetTime = parseInt(headers['x-ratelimit-reset']) * 1000;
    }
  }

  private shouldRefreshToken(): boolean {
    if (!this.tokenExpiration || !this.apiToken) {
      return false;
    }

    // Refresh token 5 minutes before expiration
    const refreshThreshold = new Date(this.tokenExpiration.getTime() - 5 * 60 * 1000);
    return new Date() > refreshThreshold;
  }

  public async refreshToken(): Promise<void> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    if (!this.config.email || !this.config.password) {
      const error = new Error('Email and password required for token refresh') as SimpleFACTError;
      error.code = ErrorCodes.UNAUTHORIZED;
      error.statusCode = 401;
      throw error;
    }

    this.refreshPromise = this.generateToken({
      email: this.config.email,
      password: this.config.password
    }).then(token => {
      this.apiToken = token;
      this.refreshPromise = undefined;
    }).catch(error => {
      this.refreshPromise = undefined;
      throw error;
    });

    return this.refreshPromise;
  }

  private async generateToken(credentials: { email: string; password: string }): Promise<string> {
    try {
      const response = await axios.post(`${this.config.baseURL}/api/auth/api-token`, credentials);

      if (response.data?.token) {
        this.apiToken = response.data.token;

        // Set token expiration if provided
        if (response.data.expires_in) {
          this.tokenExpiration = new Date(Date.now() + response.data.expires_in * 1000);
        }

        return response.data.token;
      }

      throw new Error('Invalid token response');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private isRetryableError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      // Retry on network errors or server errors (5xx)
      if (!status || status >= 500) {
        return true;
      }

      // Retry on specific client errors
      if (status === 408 || status === 429) { // Timeout or Rate limit
        return true;
      }
    }

    return false;
  }

  private handleError(error: any): SimpleFACTError {
    if (error.code && error.statusCode) {
      return error as SimpleFACTError;
    }

    if (axios.isAxiosError(error)) {
      const response = error.response;
      const data = response?.data;

      let code = ErrorCodes.SERVER_ERROR;
      let message = error.message;

      if (response) {
        switch (response.status) {
          case 400:
            code = ErrorCodes.VALIDATION_ERROR;
            break;
          case 401:
            code = ErrorCodes.UNAUTHORIZED;
            break;
          case 404:
            code = ErrorCodes.CLIENT_NOT_FOUND;
            break;
          case 429:
            code = ErrorCodes.RATE_LIMIT_EXCEEDED;
            break;
          case 500:
          default:
            code = ErrorCodes.SERVER_ERROR;
            break;
        }

        if (data?.error) {
          message = data.error;
        }
      } else {
        code = ErrorCodes.NETWORK_ERROR;
      }

      const simpleFACTError = new Error(message) as SimpleFACTError;
      simpleFACTError.code = code;
      simpleFACTError.statusCode = response?.status;
      simpleFACTError.details = data;
      simpleFACTError.originalError = error;

      return simpleFACTError;
    }

    // Handle generic errors
    const genericError = new Error(error.message || 'Unknown error occurred') as SimpleFACTError;
    genericError.code = ErrorCodes.SERVER_ERROR;
    genericError.originalError = error;

    return genericError;
  }

  // ====================================
  // PUBLIC UTILITY METHODS
  // ====================================

  /**
   * Get current rate limit information
   */
  public getRateLimitInfo(): RateLimitInfo {
    return {
      limit: this.config.rateLimitPerHour!,
      remaining: Math.max(0, this.config.rateLimitPerHour! - this.requestsThisHour),
      resetTime: new Date(this.hourlyResetTime),
      requestsThisHour: this.requestsThisHour
    };
  }

  /**
   * Get API health check
   */
  public async getHealthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await this.get<HealthCheckResult>('/api/health');
      return response.data || {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Set new API token
   */
  public setApiToken(token: string): void {
    this.apiToken = token;
  }

  /**
   * Get current API token
   */
  public getApiToken(): string | undefined {
    return this.apiToken;
  }

  /**
   * Clear authentication
   */
  public clearAuth(): void {
    this.apiToken = undefined;
    this.tokenExpiration = undefined;
  }
}
