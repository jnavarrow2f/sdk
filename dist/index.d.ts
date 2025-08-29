import { AxiosInstance } from 'axios';

interface SimpleFACTConfig {
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
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    meta?: PaginationMeta;
    details?: any;
}
interface PaginationMeta {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}
interface PaginationParams {
    page?: number;
    per_page?: number;
    limit?: number;
}
interface DateRangeParams {
    start_date?: string;
    end_date?: string;
}
interface ListParams extends PaginationParams, DateRangeParams {
    search?: string;
    status?: string;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
}
declare class SimpleFACTError extends Error {
    code?: string;
    statusCode?: number;
    details?: any;
    originalError?: any;
    constructor(message: string, code?: string, statusCode?: number, details?: any);
}
declare enum ErrorCodes {
    UNAUTHORIZED = "UNAUTHORIZED",
    INVALID_TOKEN = "INVALID_TOKEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    INVALID_ITEM = "INVALID_ITEM",
    INVALID_AMOUNT = "INVALID_AMOUNT",
    INVALID_CLIENT_ID = "INVALID_CLIENT_ID",
    CLIENT_NOT_FOUND = "CLIENT_NOT_FOUND",
    INVOICE_NOT_FOUND = "INVOICE_NOT_FOUND",
    BUDGET_NOT_FOUND = "BUDGET_NOT_FOUND",
    PAYMENT_NOT_FOUND = "PAYMENT_NOT_FOUND",
    BUDGET_ALREADY_INVOICED = "BUDGET_ALREADY_INVOICED",
    PAYMENT_EXCEEDS_REMAINING = "PAYMENT_EXCEEDS_REMAINING",
    NO_ITEMS = "NO_ITEMS",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    SERVER_ERROR = "SERVER_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    API_ERROR = "API_ERROR",
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
    MISSING_FIELD = "MISSING_FIELD",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
}
interface Client {
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
interface ClientData {
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
type ClientStatus = 'active' | 'inactive' | 'suspended';
interface Address {
    street: string;
    city: string;
    region?: string;
    postal_code?: string;
    country: string;
}
interface Budget {
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
interface BudgetData {
    client_id: number;
    issue_date: string;
    expiry_date: string;
    items: Omit<BudgetItem, 'id'>[];
    notes?: string;
}
interface BudgetUpdateData extends Partial<BudgetData> {
    status?: BudgetStatus;
}
interface BudgetItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    total?: number;
}
type BudgetStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'invoiced';
interface Invoice {
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
interface InvoiceData {
    client_id: number;
    budget_id?: number;
    issue_date: string;
    due_date: string;
    items: Omit<InvoiceItem, 'id'>[];
    notes?: string;
    payment_terms?: string;
}
interface InvoiceItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    total?: number;
}
type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';
interface Payment {
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
interface PaymentData {
    invoice_id: number;
    amount: number;
    payment_date: string;
    payment_method: PaymentMethod;
    reference?: string;
    notes?: string;
}
type PaymentMethod = 'bank_transfer' | 'cash' | 'credit_card' | 'check' | 'other';
interface InvoiceVerification {
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
interface VerificationData {
    invoice_id: number;
}
interface ClientProfileUpdate {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
}
interface ClientProfileUpdateData {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
}
interface PasswordChangeData {
    current_password: string;
    new_password: string;
    confirm_password: string;
}
interface ClientPasswordChange {
    current_password: string;
    new_password: string;
    confirm_password: string;
}
interface ClientDocument {
    id: number;
    type: 'invoice' | 'budget';
    number: string;
    date: string;
    total: number;
    status: string;
    download_url?: string;
}
interface ClientDocumentsParams extends PaginationParams, DateRangeParams {
    type?: 'invoice' | 'budget';
    status?: string;
}
interface ClientActivitySummary {
    total_invoices: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    overdue_amount: number;
    last_invoice_date?: string;
    recent_documents: ClientDocument[];
}
interface DownloadOptions {
    format?: 'pdf' | 'xml';
    filename?: string;
}
interface BulkOperationResult<T = any> {
    success: boolean;
    processed: number;
    failed: number;
    errors: Array<{
        index: number;
        error: string;
    }>;
    data: T[];
}
interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetTime: Date;
    requestsThisHour: number;
}
interface HealthCheckResult {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services?: {
        api: boolean;
        database: boolean;
        auth: boolean;
    };
}
interface UseResourceOptions<T = any> {
    auto_fetch?: boolean;
    cache_key?: string;
    refresh_interval?: number;
    on_success?: (data: T) => void;
    on_error?: (error: SimpleFACTError) => void;
}
interface UseResourceResult<T = any> {
    data: T | null;
    loading: boolean;
    error: SimpleFACTError | null;
    refresh: () => Promise<void>;
    mutate: (newData: T) => void;
}
interface UseListResult<T = any> extends UseResourceResult<T[]> {
    create: (item: Omit<T, 'id'>) => Promise<T>;
    update: (id: number, updates: Partial<T>) => Promise<T>;
    remove: (id: number) => Promise<void>;
    pagination: PaginationMeta | null;
    filters: any;
    setFilters: (filters: any) => void;
}
interface UseMutationOptions<TData = any, TVariables = any> {
    on_success?: (data: TData, variables: TVariables) => void;
    on_error?: (error: SimpleFACTError, variables: TVariables) => void;
    on_settled?: (data: TData | undefined, error: SimpleFACTError | null, variables: TVariables) => void;
    retry?: number;
    retry_delay?: number;
}
interface UseMutationResult<TData = any, TVariables = any> {
    mutate: (variables: TVariables) => Promise<TData>;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    data: TData | undefined;
    error: SimpleFACTError | null;
    loading: boolean;
    reset: () => void;
}
interface ClientProfile extends Client {
}
interface ClientsListParams extends ListParams {
    status?: ClientStatus;
    company_id?: number;
}
interface ClientWebAccessData {
    enabled: boolean;
    username?: string;
    password?: string;
    expires_at?: string;
}
interface InvoicesListParams extends ListParams {
    status?: InvoiceStatus;
    payment_status?: PaymentStatus;
    client_id?: number;
    year?: number;
    month?: number;
}
interface InvoiceStatusUpdate {
    status: InvoiceStatus;
    notes?: string;
}
interface SimpleFACTClient$1 {
    baseURL: string;
    apiToken?: string;
    timeout: number;
    debug: boolean;
    rateLimitPerHour: number;
    autoRefreshToken: boolean;
    get<T = any>(url: string, config?: any): Promise<ApiResponse<T>>;
    post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;
    put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;
    delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;
    clients: any;
    invoices: any;
    budgets: any;
    payments: any;
    verification: any;
    clientPortal: any;
    refreshToken(): Promise<void>;
    getHealthCheck(): Promise<HealthCheckResult>;
    getRateLimitInfo(): RateLimitInfo;
}

declare class BudgetsService {
    private http;
    constructor(http: AxiosInstance);
    /**
     * List all budgets with optional filtering and pagination
     */
    list(params?: ListParams & {
        status?: BudgetStatus;
        client_id?: number;
        year?: number;
        month?: number;
        expired_only?: boolean;
    }): Promise<Budget[]>;
    /**
     * Get a specific budget by ID
     */
    get(id: number): Promise<Budget>;
    /**
     * Create a new budget
     */
    create(budgetData: BudgetData): Promise<Budget>;
    /**
     * Update an existing budget
     */
    update(id: number, budgetData: BudgetUpdateData): Promise<Budget>;
    /**
     * Delete a budget
     */
    delete(id: number): Promise<boolean>;
    /**
     * Approve a budget
     */
    approve(id: number): Promise<Budget>;
    /**
     * Reject a budget
     */
    reject(id: number): Promise<Budget>;
    /**
     * Convert budget to invoice
     */
    convertToInvoice(id: number): Promise<{
        invoice_id: number;
        invoice_number: string;
    }>;
    /**
     * Search budgets by number, client name, or description
     */
    search(query: string, limit?: number): Promise<Budget[]>;
    /**
     * Get budgets by status
     */
    getByStatus(status: BudgetStatus, limit?: number): Promise<Budget[]>;
    /**
     * Get pending budgets
     */
    getPending(limit?: number): Promise<Budget[]>;
    /**
     * Get approved budgets
     */
    getApproved(limit?: number): Promise<Budget[]>;
    /**
     * Get expired budgets
     */
    getExpired(limit?: number): Promise<Budget[]>;
    /**
     * Get budgets for a specific client
     */
    getByClient(clientId: number, limit?: number): Promise<Budget[]>;
    /**
     * Get budgets for a specific time period
     */
    getByDateRange(dateFrom: string, dateTo: string, limit?: number): Promise<Budget[]>;
    /**
     * Get budget statistics
     */
    getStatistics(): Promise<{
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
    }>;
    /**
     * Duplicate a budget
     */
    duplicate(id: number, newClientId?: number): Promise<Budget>;
    /**
     * Validate budget data before creation/update
     */
    private validateBudgetData;
    /**
     * Handle and transform errors
     */
    private handleError;
}

declare class ClientPortalService {
    private http;
    constructor(http: AxiosInstance);
    /**
     * Get client profile information
     */
    getProfile(): Promise<ClientProfile>;
    /**
     * Update client profile information
     */
    updateProfile(profileData: ClientProfileUpdateData): Promise<boolean>;
    /**
     * Change client password
     */
    changePassword(passwordData: PasswordChangeData): Promise<boolean>;
    /**
     * Get client's invoices
     */
    getInvoices(params?: ListParams & {
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
    }>;
    /**
     * Get client's budgets
     */
    getBudgets(params?: ListParams & {
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
    }>;
    /**
     * Download document PDF (invoice or budget)
     */
    downloadDocument(documentId: number, type: 'invoice' | 'budget'): Promise<Blob>;
    /**
     * Get pending invoices for client
     */
    getPendingInvoices(): Promise<Invoice[]>;
    /**
     * Get paid invoices for client
     */
    getPaidInvoices(limit?: number): Promise<Invoice[]>;
    /**
     * Get overdue invoices for client
     */
    getOverdueInvoices(): Promise<Invoice[]>;
    /**
     * Get recent activity (invoices and budgets)
     */
    getRecentActivity(limit?: number): Promise<{
        invoices: Invoice[];
        budgets: Budget[];
    }>;
    /**
     * Get client dashboard summary
     */
    getDashboardSummary(): Promise<{
        profile: ClientProfile;
        pendingInvoices: Invoice[];
        recentBudgets: Budget[];
        statistics: {
            totalInvoices: number;
            totalBudgets: number;
            totalPaid: number;
            totalPending: number;
        };
    }>;
    /**
     * Search client's documents
     */
    searchDocuments(query: string, type?: 'invoices' | 'budgets' | 'all'): Promise<{
        invoices: Invoice[];
        budgets: Budget[];
    }>;
    /**
     * Validate profile update data
     */
    private validateProfileData;
    /**
     * Validate password change data
     */
    private validatePasswordData;
    /**
     * Handle and transform errors
     */
    private handleError;
}

declare class InvoicesService {
    private client;
    constructor(client: any);
    /**
     * Get all invoices with optional filters
     */
    getAll(params?: InvoicesListParams): Promise<ApiResponse<Invoice[]>>;
    /**
     * Get invoice by ID
     */
    getById(id: number): Promise<ApiResponse<Invoice>>;
    /**
     * Create new invoice
     */
    create(invoiceData: InvoiceData): Promise<Invoice>;
    /**
     * Update existing invoice
     */
    update(id: number, updates: Partial<Invoice>): Promise<Invoice>;
    /**
     * Delete invoice
     */
    delete(id: number): Promise<void>;
    /**
     * Update invoice status
     */
    updateStatus(id: number, statusUpdate: InvoiceStatusUpdate): Promise<Invoice>;
    /**
     * Download invoice PDF
     */
    downloadPDF(id: number, options?: DownloadOptions): Promise<Blob>;
    /**
     * Download invoice XML
     */
    downloadXML(id: number, options?: DownloadOptions): Promise<Blob>;
    /**
     * Get invoices by status
     */
    getByStatus(status: string, limit?: number): Promise<Invoice[]>;
    /**
     * Get overdue invoices
     */
    getOverdue(limit?: number): Promise<Invoice[]>;
    /**
     * Get paid invoices
     */
    getPaid(limit?: number): Promise<Invoice[]>;
    /**
     * Get pending invoices
     */
    getPending(limit?: number): Promise<Invoice[]>;
    /**
     * Get invoices by date range
     */
    getByDateRange(dateFrom: string, dateTo: string, limit?: number): Promise<Invoice[]>;
    /**
     * Get invoices for specific client
     */
    getByClient(clientId: number, limit?: number): Promise<Invoice[]>;
    /**
     * Search invoices by number or client name
     */
    search(query: string, limit?: number): Promise<Invoice[]>;
    /**
     * Get invoice statistics
     */
    getStatistics(): Promise<{
        totalInvoices: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        averageAmount: number;
    }>;
    private validateInvoiceData;
    private validateItems;
    private validateDates;
}

declare class PaymentsService {
    private http;
    constructor(http: AxiosInstance);
    /**
     * List all payments for a specific invoice
     */
    listByInvoice(invoiceId: number): Promise<{
        payments: Payment[];
        invoice: {
            id: number;
            invoice_number: string;
            total: number;
            total_paid: number;
            remaining_amount: number;
            payment_status: string;
        };
    }>;
    /**
     * Register a new payment for an invoice
     */
    create(paymentData: PaymentData): Promise<{
        payment: Payment;
        invoice: {
            id: number;
            invoice_number: string;
            total: number;
            total_paid: number;
            remaining_amount: number;
            payment_status: string;
        };
    }>;
    /**
     * Update an existing payment
     */
    update(invoiceId: number, paymentId: number, paymentData: Partial<PaymentData>): Promise<boolean>;
    /**
     * Delete a payment
     */
    delete(invoiceId: number, paymentId: number): Promise<boolean>;
    /**
     * Get payment statistics for an invoice
     */
    getInvoicePaymentStats(invoiceId: number): Promise<{
        totalPaid: number;
        remainingAmount: number;
        paymentCount: number;
        lastPaymentDate?: string;
        paymentMethods: {
            method: PaymentMethod;
            count: number;
            amount: number;
        }[];
    }>;
    /**
     * Register full payment for an invoice
     */
    payInFull(invoiceId: number, paymentMethod?: PaymentMethod, reference?: string, notes?: string): Promise<{
        payment: Payment;
        invoice: any;
    }>;
    /**
     * Get all payment methods used by a company
     */
    getUsedPaymentMethods(): Promise<PaymentMethod[]>;
    /**
     * Validate payment data before creation/update
     */
    private validatePaymentData;
    /**
     * Handle and transform errors
     */
    private handleError;
}

/**
 * Set global SimpleFact client instance
 */
declare function setSimpleFACTClient(client: any): void;
/**
 * Get global SimpleFact client instance
 */
declare function getSimpleFACTClient(): any;
/**
 * Hook for managing clients
 */
declare function useClients(params?: ListParams): UseListResult<Client>;
/**
 * Hook for single client
 */
declare function useClient(id: number, options?: UseResourceOptions<Client>): UseResourceResult<Client>;
/**
 * Hook for managing budgets
 */
declare function useBudgets(params?: ListParams): UseListResult<Budget>;
/**
 * Hook for single budget
 */
declare function useBudget(id: number, options?: UseResourceOptions<Budget>): UseResourceResult<Budget>;
/**
 * Hook for managing invoices
 */
declare function useInvoices(params?: ListParams): UseListResult<Invoice>;
/**
 * Hook for single invoice
 */
declare function useInvoice(id: number, options?: UseResourceOptions<Invoice>): UseResourceResult<Invoice>;
/**
 * Hook for managing payments with corrected create function signature
 */
declare function usePayments(params?: ListParams): Omit<UseListResult<Payment>, 'create'> & {
    create: (invoiceId: number, paymentData: Omit<PaymentData, "invoice_id">) => Promise<Payment>;
};
/**
 * Hook for client profile management
 */
declare function useClientProfile(options?: UseResourceOptions<ClientProfile>): UseResourceResult<ClientProfile>;
/**
 * Hook for client activity summary
 */
declare function useClientActivity(options?: UseResourceOptions<any>): UseResourceResult<any>;
/**
 * Hook for invoice verification
 */
declare function useVerification(code: string, options?: UseResourceOptions<any>): UseResourceResult<any>;
/**
 * Hook for rate limit information
 */
declare function useRateLimit(): RateLimitInfo;
/**
 * Hook for health check
 */
declare function useHealthCheck(options?: UseResourceOptions<HealthCheckResult>): UseResourceResult<HealthCheckResult>;
/**
 * Hook for file downloads
 */
declare function useDownload(): {
    downloading: boolean;
    error: SimpleFACTError | null;
    downloadInvoicePDF: (invoiceId: number, filename?: string) => Promise<void>;
    downloadBudgetPDF: (budgetId: number, filename?: string) => Promise<void>;
};
/**
 * Hook for updating client profile
 */
declare function useUpdateClientProfile(): {
    updateProfile: (profileData: ClientProfileUpdateData) => Promise<boolean>;
    changePassword: (passwordData: PasswordChangeData) => Promise<boolean>;
    loading: boolean;
    error: SimpleFACTError | null;
};

declare class SimpleFACTClient implements SimpleFACTClient$1 {
    baseURL: string;
    apiToken?: string;
    timeout: number;
    debug: boolean;
    rateLimitPerHour: number;
    autoRefreshToken: boolean;
    clients: any;
    invoices: InvoicesService;
    budgets: BudgetsService;
    payments: PaymentsService;
    verification: any;
    clientPortal: ClientPortalService;
    private httpClient;
    constructor(config: SimpleFACTConfig);
    get<T = any>(url: string, config?: any): Promise<ApiResponse<T>>;
    post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;
    put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;
    delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>>;
    request<T = any>(config: any): Promise<{
        data: T;
        meta?: any;
    }>;
    getHttpClient(): any;
    refreshToken(): Promise<void>;
    getHealthCheck(): Promise<HealthCheckResult>;
    getRateLimitInfo(): {
        limit: number;
        remaining: number;
        resetTime: Date;
        requestsThisHour: number;
    };
}

export { type Address, type ApiResponse, type Budget, type BudgetData, type BudgetItem, type BudgetStatus, type BudgetUpdateData, BudgetsService, type BulkOperationResult, type Client, type ClientActivitySummary, type ClientData, type ClientDocument, type ClientDocumentsParams, type ClientPasswordChange, ClientPortalService, type ClientProfile, type ClientProfileUpdate, type ClientProfileUpdateData, type ClientStatus, type ClientWebAccessData, type ClientsListParams, type DateRangeParams, type DownloadOptions, ErrorCodes, type HealthCheckResult, type Invoice, type InvoiceData, type InvoiceItem, type InvoiceStatus, type InvoiceStatusUpdate, type InvoiceVerification, type InvoicesListParams, InvoicesService, type ListParams, type PaginationMeta, type PaginationParams, type PasswordChangeData, type Payment, type PaymentData, type PaymentMethod, type PaymentStatus, PaymentsService, type RateLimitInfo, SimpleFACTClient, type SimpleFACTConfig, SimpleFACTError, type UseListResult, type UseMutationOptions, type UseMutationResult, type UseResourceOptions, type UseResourceResult, type VerificationData, SimpleFACTClient as default, getSimpleFACTClient, setSimpleFACTClient, useBudget, useBudgets, useClient, useClientActivity, useClientProfile, useClients, useDownload, useHealthCheck, useInvoice, useInvoices, usePayments, useRateLimit, useUpdateClientProfile, useVerification };
