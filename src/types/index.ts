// ====================================
// SIMPLEFACT SDK - TYPES
// Tipos TypeScript para la API REST v115
// ====================================

export interface SimpleFACTConfig {
  /** Base URL of the SimpleFact API */
  baseURL: string;

  /** API token for authentication */
  apiToken?: string;

  /** Alternative API key field (aliased to apiToken) */
  apiKey?: string;

  /** Email for token generation and auto-refresh */
  email?: string;

  /** Password for token generation and auto-refresh */
  password?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Rate limit per hour (default: 1000) */
  rateLimitPerHour?: number;

  /** Enable debug logging (default: false) */
  debug?: boolean;

  /** Number of retry attempts on failure (default: 3) */
  retryAttempts?: number;

  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;

  /** Auto-refresh token when near expiration (default: true) */
  autoRefreshToken?: boolean;

  /** Additional HTTP headers */
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: PaginationMeta;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  limit?: number;
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

// Common interface for list parameters
export interface ListParams extends PaginationParams, DateRangeParams {
  search?: string;
  status?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// ====================================
// ERROR HANDLING
// ====================================

export class SimpleFACTError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
  originalError?: any;

  constructor(message: string, code?: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'SimpleFACTError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export enum ErrorCodes {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_ITEM = 'INVALID_ITEM',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CLIENT_ID = 'INVALID_CLIENT_ID',

  // Resources
  CLIENT_NOT_FOUND = 'CLIENT_NOT_FOUND',
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  BUDGET_NOT_FOUND = 'BUDGET_NOT_FOUND',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',

  // Business Logic
  BUDGET_ALREADY_INVOICED = 'BUDGET_ALREADY_INVOICED',
  PAYMENT_EXCEEDS_REMAINING = 'PAYMENT_EXCEEDS_REMAINING',
  NO_ITEMS = 'NO_ITEMS',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',

  // General errors
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  MISSING_FIELD = 'MISSING_FIELD',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
}

// ====================================
// CLIENT TYPES
// ====================================

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
  tax_id?: string;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
  billing_address?: Address;
  contact_person?: string;
  website?: string;
  notes?: string;
}

export interface ClientData {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
  tax_id?: string;
  contact_person?: string;
  website?: string;
  notes?: string;
}

export type ClientStatus = 'active' | 'inactive' | 'suspended';

export interface Address {
  street: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
}

// ====================================
// BUDGET TYPES
// ====================================

export interface Budget {
  id: number;
  budget_number: string;
  client_id: number;
  client?: Client;
  issue_date: string;
  expiry_date: string;
  status: BudgetStatus;
  total?: number;
  tax_amount?: number;
  items: BudgetItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
  pdf_url?: string;
}

export interface BudgetData {
  client_id: number;
  issue_date: string;
  expiry_date: string;
  items: Omit<BudgetItem, 'id'>[];
  notes?: string;
}

export interface BudgetUpdateData extends Partial<BudgetData> {
  status?: BudgetStatus;
}

export interface BudgetItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total?: number;
}

export type BudgetStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'invoiced';

// ====================================
// INVOICE TYPES
// ====================================

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client?: Client;
  budget_id?: number;
  budget?: Budget;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  total: number;
  tax_amount: number;
  paid_amount: number;
  remaining_amount: number;
  items: InvoiceItem[];
  notes?: string;
  payment_terms?: string;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  pdf_url?: string;
  xml_url?: string;
}

export interface InvoiceData {
  client_id: number;
  budget_id?: number;
  issue_date: string;
  due_date: string;
  items: Omit<InvoiceItem, 'id'>[];
  notes?: string;
  payment_terms?: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total?: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

// ====================================
// PAYMENT TYPES
// ====================================

export interface Payment {
  id: number;
  invoice_id: number;
  invoice?: Invoice;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface PaymentData {
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export type PaymentMethod = 'bank_transfer' | 'cash' | 'credit_card' | 'check' | 'other';

// ====================================
// VERIFICATION TYPES
// ====================================

export interface InvoiceVerification {
  id: number;
  invoice_id: number;
  invoice?: Invoice;
  verification_code: string;
  qr_code_url: string;
  public_url: string;
  verified_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface VerificationData {
  invoice_id: number;
}

// ====================================
// CLIENT PORTAL TYPES
// ====================================

export interface ClientProfileUpdate {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface ClientProfileUpdateData {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ClientPasswordChange {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ClientDocument {
  id: number;
  type: 'invoice' | 'budget';
  number: string;
  date: string;
  total: number;
  status: string;
  download_url?: string;
}

export interface ClientDocumentsParams extends PaginationParams, DateRangeParams {
  type?: 'invoice' | 'budget';
  status?: string;
}

export interface ClientActivitySummary {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  last_invoice_date?: string;
  recent_documents: ClientDocument[];
}

// ====================================
// UTILITY TYPES
// ====================================

export interface DownloadOptions {
  format?: 'pdf' | 'xml';
  filename?: string;
}

export interface BulkOperationResult<T = any> {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  data: T[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  requestsThisHour: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services?: {
    api: boolean;
    database: boolean;
    auth: boolean;
  };
}

// ====================================
// HOOK TYPES (for React integration)
// ====================================

export interface UseResourceOptions<T = any> {
  auto_fetch?: boolean;
  cache_key?: string;
  refresh_interval?: number;
  on_success?: (data: T) => void;
  on_error?: (error: SimpleFACTError) => void;
}

export interface UseResourceResult<T = any> {
  data: T | null;
  loading: boolean;
  error: SimpleFACTError | null;
  refresh: () => Promise<void>;
  mutate: (newData: T) => void;
}

export interface UseListResult<T = any> extends UseResourceResult<T[]> {
  create: (item: Omit<T, 'id'>) => Promise<T>;
  update: (id: number, updates: Partial<T>) => Promise<T>;
  remove: (id: number) => Promise<void>;
  pagination: PaginationMeta | null;
  filters: any;
  setFilters: (filters: any) => void;
}

export interface UseMutationOptions<TData = any, TVariables = any> {
  on_success?: (data: TData, variables: TVariables) => void;
  on_error?: (error: SimpleFACTError, variables: TVariables) => void;
  on_settled?: (data: TData | undefined, error: SimpleFACTError | null, variables: TVariables) => void;
  retry?: number;
  retry_delay?: number;
}

export interface UseMutationResult<TData = any, TVariables = any> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: SimpleFACTError | null;
  loading: boolean;
  reset: () => void;
}

// ====================================
// ADDITIONAL TYPES FOR SERVICES
// ====================================

// Client portal types
export interface ClientProfile extends Client {}

// Service-specific parameter types
export interface ClientsListParams extends ListParams {
  status?: ClientStatus;
  company_id?: number;
}

export interface ClientWebAccessData {
  enabled: boolean;
  username?: string;
  password?: string;
  expires_at?: string;
}

export interface InvoicesListParams extends ListParams {
  status?: InvoiceStatus;
  payment_status?: PaymentStatus;
  client_id?: number;
  year?: number;
  month?: number;
}

export interface InvoiceStatusUpdate {
  status: InvoiceStatus;
  notes?: string;
}

// ====================================
// SDK CLIENT EXPORT
// ====================================

// Forward declaration for circular dependency resolution
export interface SimpleFACTClient {
  baseURL: string;
  apiToken?: string;
  timeout: number;
  debug: boolean;
  rateLimitPerHour: number;
  autoRefreshToken: boolean;

  // HTTP methods
  get<T = any>(url: string, config?: any): Promise<ApiResponse<T>>;
  post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;
  put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;

  // Services
  clients: any;
  invoices: any;
  budgets: any;
  payments: any;
  verification: any;
  clientPortal: any;

  // Utility methods
  refreshToken(): Promise<void>;
  getHealthCheck(): Promise<HealthCheckResult>;
  getRateLimitInfo(): RateLimitInfo;
}
