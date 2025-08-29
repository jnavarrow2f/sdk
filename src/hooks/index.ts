// ====================================
// SIMPLEFACT SDK - REACT HOOKS
// Hooks para integración React v115
// ====================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Client,
  Budget,
  Invoice,
  Payment,
  ListParams,
  UseResourceOptions,
  UseResourceResult,
  UseListResult,
  SimpleFACTError,
  PaginationMeta,
  ClientData,
  BudgetData,
  InvoiceData,
  PaymentData,
  RateLimitInfo,
  HealthCheckResult,
  ClientProfile,
  ClientProfileUpdateData,
  PasswordChangeData
} from '../types';

// Global client instance
let globalClient: any = null;

/**
 * Set global SimpleFact client instance
 */
export function setSimpleFACTClient(client: any): void {
  globalClient = client;
}

/**
 * Get global SimpleFact client instance
 */
export function getSimpleFACTClient(): any {
  if (!globalClient) {
    throw new Error('SimpleFact client not initialized. Call setSimpleFACTClient() first.');
  }
  return globalClient;
}

// ====================================
// UTILITY HOOKS
// ====================================

/**
 * Base hook for resource management
 */
function useResource<T>(
  fetcher: () => Promise<T>,
  options: UseResourceOptions<T> = {}
): UseResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SimpleFACTError | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      if (isMountedRef.current) {
        setData(result);
        options.on_success?.(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err as SimpleFACTError;
        setError(error);
        options.on_error?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher, options.on_success, options.on_error]);

  const mutate = useCallback((newData: T) => {
    if (isMountedRef.current) {
      setData(newData);
    }
  }, []);

  useEffect(() => {
    if (options.auto_fetch !== false) {
      fetchData();
    }
  }, [fetchData, options.auto_fetch]);

  // Auto-refresh interval
  useEffect(() => {
    if (options.refresh_interval && options.refresh_interval > 0) {
      const interval = setInterval(fetchData, options.refresh_interval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, options.refresh_interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    mutate
  };
}

/**
 * Hook for list resources with CRUD operations
 */
function useListResource<T extends { id: number }>(
  listFetcher: () => Promise<{ data: T[]; meta?: PaginationMeta }>,
  createFetcher: (data: Omit<T, 'id'>) => Promise<T>,
  updateFetcher: (id: number, data: Partial<T>) => Promise<T>,
  deleteFetcher: (id: number) => Promise<void>,
  options: UseResourceOptions<T[]> = {}
): UseListResult<T> {
  const [filters, setFilters] = useState<any>({});
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const { data, loading, error, refresh, mutate } = useResource<T[]>(
    async () => {
      const result = await listFetcher();
      setPagination(result.meta || null);
      return result.data;
    },
    options
  );

  const create = useCallback(async (item: Omit<T, 'id'>): Promise<T> => {
    const newItem = await createFetcher(item);
    if (data) {
      mutate([...data, newItem]);
    }
    return newItem;
  }, [data, mutate, createFetcher]);

  const update = useCallback(async (id: number, updates: Partial<T>): Promise<T> => {
    const updatedItem = await updateFetcher(id, updates);
    if (data) {
      mutate(data.map((item: T) => item.id === id ? updatedItem : item));
    }
    return updatedItem;
  }, [data, mutate, updateFetcher]);

  const remove = useCallback(async (id: number): Promise<void> => {
    await deleteFetcher(id);
    if (data) {
      mutate(data.filter((item: T) => item.id !== id));
    }
  }, [data, mutate, deleteFetcher]);

  return {
    data,
    loading,
    error,
    refresh,
    mutate,
    create,
    update,
    remove,
    pagination,
    filters,
    setFilters
  };
}

// ====================================
// CLIENT HOOKS
// ====================================

/**
 * Hook for managing clients
 */
export function useClients(params: ListParams = {}): UseListResult<Client> {
  const client = getSimpleFACTClient();

  return useListResource<Client>(
    async () => {
      const response = await client.clients.getAll(params);
      return { data: response.data || [], meta: response.meta };
    },
    (data: Omit<Client, 'id'>) => client.clients.create(data),
    (id: number, updates: Partial<Client>) => client.clients.update(id, updates),
    (id: number) => client.clients.delete(id)
  );
}

/**
 * Hook for single client
 */
export function useClient(id: number, options: UseResourceOptions<Client> = {}): UseResourceResult<Client> {
  const client = getSimpleFACTClient();

  return useResource<Client>(
    async () => {
      const response = await client.clients.getById(id);
      return response.data;
    },
    options
  );
}

// ====================================
// BUDGET HOOKS
// ====================================

/**
 * Hook for managing budgets
 */
export function useBudgets(params: ListParams = {}): UseListResult<Budget> {
  const client = getSimpleFACTClient();

  return useListResource<Budget>(
    async () => {
      const response = await client.budgets.getAll(params);
      return { data: response.data || [], meta: response.meta };
    },
    (data: Omit<Budget, 'id'>) => client.budgets.create(data),
    (id: number, updates: Partial<Budget>) => client.budgets.update(id, updates),
    (id: number) => client.budgets.delete(id)
  );
}

/**
 * Hook for single budget
 */
export function useBudget(id: number, options: UseResourceOptions<Budget> = {}): UseResourceResult<Budget> {
  const client = getSimpleFACTClient();

  return useResource<Budget>(
    async () => {
      const response = await client.budgets.getById(id);
      return response.data;
    },
    options
  );
}

// ====================================
// INVOICE HOOKS
// ====================================

/**
 * Hook for managing invoices
 */
export function useInvoices(params: ListParams = {}): UseListResult<Invoice> {
  const client = getSimpleFACTClient();

  return useListResource<Invoice>(
    async () => {
      const response = await client.invoices.getAll(params);
      return { data: response.data || [], meta: response.meta };
    },
    (data: Omit<Invoice, 'id'>) => client.invoices.create(data),
    (id: number, updates: Partial<Invoice>) => client.invoices.update(id, updates),
    (id: number) => client.invoices.delete(id)
  );
}

/**
 * Hook for single invoice
 */
export function useInvoice(id: number, options: UseResourceOptions<Invoice> = {}): UseResourceResult<Invoice> {
  const client = getSimpleFACTClient();

  return useResource<Invoice>(
    async () => {
      const response = await client.invoices.getById(id);
      return response.data;
    },
    options
  );
}

// ====================================
// PAYMENT HOOKS
// ====================================

/**
 * Hook for managing payments with corrected create function signature
 */
export function usePayments(params: ListParams = {}): Omit<UseListResult<Payment>, 'create'> & {
  create: (invoiceId: number, paymentData: Omit<PaymentData, "invoice_id">) => Promise<Payment>;
} {
  const client = getSimpleFACTClient();

  const baseListResult = useListResource<Payment>(
    async () => {
      const response = await client.payments.getAll(params);
      return { data: response.data || [], meta: response.meta };
    },
    (data: Omit<Payment, 'id'>) => client.payments.create(data),
    (id: number, updates: Partial<Payment>) => client.payments.update(id, updates),
    (id: number) => client.payments.delete(id)
  );

  // Override the create function to match the expected signature
  const create = useCallback(async (invoiceId: number, paymentData: Omit<PaymentData, "invoice_id">): Promise<Payment> => {
    const fullPaymentData: PaymentData = {
      ...paymentData,
      invoice_id: invoiceId
    };
    const response = await client.payments.create(fullPaymentData);
    const newPayment = response.data || response;

    if (baseListResult.data) {
      baseListResult.mutate([...baseListResult.data, newPayment]);
    }
    return newPayment;
  }, [client, baseListResult.data, baseListResult.mutate]);

  return {
    ...baseListResult,
    create
  };
}

// ====================================
// CLIENT PORTAL HOOKS
// ====================================

/**
 * Hook for client profile management
 */
export function useClientProfile(options: UseResourceOptions<ClientProfile> = {}): UseResourceResult<ClientProfile> {
  const client = getSimpleFACTClient();

  return useResource<ClientProfile>(
    async () => {
      const response = await client.clientPortal.getProfile();
      return response.data || response;
    },
    options
  );
}

/**
 * Hook for client activity summary
 */
export function useClientActivity(options: UseResourceOptions<any> = {}): UseResourceResult<any> {
  const client = getSimpleFACTClient();

  return useResource<any>(
    async () => {
      const response = await client.clientPortal.getActivitySummary();
      return response.data || response;
    },
    options
  );
}

// ====================================
// VERIFICATION HOOKS
// ====================================

/**
 * Hook for invoice verification
 */
export function useVerification(code: string, options: UseResourceOptions<any> = {}): UseResourceResult<any> {
  const client = getSimpleFACTClient();

  return useResource<any>(
    async () => {
      const response = await client.verification.verifyInvoice(code);
      return response.data || response;
    },
    options
  );
}

// ====================================
// UTILITY HOOKS
// ====================================

/**
 * Hook for rate limit information
 */
export function useRateLimit(): RateLimitInfo {
  const client = getSimpleFACTClient();
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>(client.getRateLimitInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitInfo(client.getRateLimitInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, [client]);

  return rateLimitInfo;
}

/**
 * Hook for health check
 */
export function useHealthCheck(options: UseResourceOptions<HealthCheckResult> = {}): UseResourceResult<HealthCheckResult> {
  const client = getSimpleFACTClient();

  return useResource<HealthCheckResult>(
    async () => {
      const response = await client.getHealthCheck();
      return response.data || response;
    },
    { refresh_interval: 30000, ...options }
  );
}

/**
 * Hook for file downloads
 */
export function useDownload() {
  const client = getSimpleFACTClient();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<SimpleFACTError | null>(null);

  const downloadInvoicePDF = useCallback(async (invoiceId: number, filename?: string): Promise<void> => {
    setDownloading(true);
    setError(null);

    try {
      await client.invoices.downloadPDF(invoiceId, { filename });
    } catch (err) {
      setError(err as SimpleFACTError);
    } finally {
      setDownloading(false);
    }
  }, [client]);

  const downloadBudgetPDF = useCallback(async (budgetId: number, filename?: string): Promise<void> => {
    setDownloading(true);
    setError(null);

    try {
      await client.budgets.downloadPDF(budgetId, { filename });
    } catch (err) {
      setError(err as SimpleFACTError);
    } finally {
      setDownloading(false);
    }
  }, [client]);

  return {
    downloading,
    error,
    downloadInvoicePDF,
    downloadBudgetPDF
  };
}

/**
 * Hook for updating client profile
 */
export function useUpdateClientProfile() {
  const client = getSimpleFACTClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SimpleFACTError | null>(null);

  const updateProfile = useCallback(async (profileData: ClientProfileUpdateData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await client.clientPortal.updateProfile(profileData);
      return response.data || response;
    } catch (err) {
      setError(err as SimpleFACTError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const changePassword = useCallback(async (passwordData: PasswordChangeData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await client.clientPortal.changePassword(passwordData);
      return response.data || response;
    } catch (err) {
      setError(err as SimpleFACTError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    updateProfile,
    changePassword,
    loading,
    error
  };
}
