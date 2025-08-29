"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BudgetsService: () => BudgetsService,
  ClientPortalService: () => ClientPortalService,
  ErrorCodes: () => ErrorCodes,
  InvoicesService: () => InvoicesService,
  PaymentsService: () => PaymentsService,
  SimpleFACTClient: () => SimpleFACTClient,
  SimpleFACTError: () => SimpleFACTError,
  default: () => index_default,
  getSimpleFACTClient: () => getSimpleFACTClient,
  setSimpleFACTClient: () => setSimpleFACTClient,
  useBudget: () => useBudget,
  useBudgets: () => useBudgets,
  useClient: () => useClient,
  useClientActivity: () => useClientActivity,
  useClientProfile: () => useClientProfile,
  useClients: () => useClients,
  useDownload: () => useDownload,
  useHealthCheck: () => useHealthCheck,
  useInvoice: () => useInvoice,
  useInvoices: () => useInvoices,
  usePayments: () => usePayments,
  useRateLimit: () => useRateLimit,
  useUpdateClientProfile: () => useUpdateClientProfile,
  useVerification: () => useVerification
});
module.exports = __toCommonJS(index_exports);

// src/types/index.ts
var SimpleFACTError = class extends Error {
  constructor(message, code, statusCode, details) {
    super(message);
    this.name = "SimpleFACTError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
};
var ErrorCodes = /* @__PURE__ */ ((ErrorCodes2) => {
  ErrorCodes2["UNAUTHORIZED"] = "UNAUTHORIZED";
  ErrorCodes2["INVALID_TOKEN"] = "INVALID_TOKEN";
  ErrorCodes2["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
  ErrorCodes2["VALIDATION_ERROR"] = "VALIDATION_ERROR";
  ErrorCodes2["INVALID_INPUT"] = "INVALID_INPUT";
  ErrorCodes2["INVALID_ITEM"] = "INVALID_ITEM";
  ErrorCodes2["INVALID_AMOUNT"] = "INVALID_AMOUNT";
  ErrorCodes2["INVALID_CLIENT_ID"] = "INVALID_CLIENT_ID";
  ErrorCodes2["CLIENT_NOT_FOUND"] = "CLIENT_NOT_FOUND";
  ErrorCodes2["INVOICE_NOT_FOUND"] = "INVOICE_NOT_FOUND";
  ErrorCodes2["BUDGET_NOT_FOUND"] = "BUDGET_NOT_FOUND";
  ErrorCodes2["PAYMENT_NOT_FOUND"] = "PAYMENT_NOT_FOUND";
  ErrorCodes2["BUDGET_ALREADY_INVOICED"] = "BUDGET_ALREADY_INVOICED";
  ErrorCodes2["PAYMENT_EXCEEDS_REMAINING"] = "PAYMENT_EXCEEDS_REMAINING";
  ErrorCodes2["NO_ITEMS"] = "NO_ITEMS";
  ErrorCodes2["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
  ErrorCodes2["SERVER_ERROR"] = "SERVER_ERROR";
  ErrorCodes2["NETWORK_ERROR"] = "NETWORK_ERROR";
  ErrorCodes2["API_ERROR"] = "API_ERROR";
  ErrorCodes2["NOT_FOUND_ERROR"] = "NOT_FOUND_ERROR";
  ErrorCodes2["MISSING_FIELD"] = "MISSING_FIELD";
  ErrorCodes2["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
  return ErrorCodes2;
})(ErrorCodes || {});

// src/services/BudgetsService.ts
var BudgetsService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all budgets with optional filtering and pagination
   */
  async list(params) {
    try {
      const response = await this.http.get("/budgets", { params });
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error, "Failed to list budgets");
    }
  }
  /**
   * Get a specific budget by ID
   */
  async get(id) {
    try {
      const response = await this.http.get(`/budgets/${id}`);
      if (!response.data.data) {
        throw new SimpleFACTError(
          `Budget with ID ${id} not found`,
          "BUDGET_NOT_FOUND",
          404
        );
      }
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get budget ${id}`);
    }
  }
  /**
   * Create a new budget
   */
  async create(budgetData) {
    try {
      this.validateBudgetData(budgetData);
      const response = await this.http.post("/budgets", budgetData);
      if (!response.data.data) {
        throw new SimpleFACTError(
          "Failed to create budget - no data returned",
          "API_ERROR"
        );
      }
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to create budget");
    }
  }
  /**
   * Update an existing budget
   */
  async update(id, budgetData) {
    try {
      if (Object.keys(budgetData).length === 0) {
        throw new SimpleFACTError(
          "No data provided for update",
          "MISSING_FIELD"
        );
      }
      const response = await this.http.put(`/budgets/${id}`, budgetData);
      if (!response.data.data) {
        throw new SimpleFACTError(
          `Budget with ID ${id} not found`,
          "BUDGET_NOT_FOUND",
          404
        );
      }
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update budget ${id}`);
    }
  }
  /**
   * Delete a budget
   */
  async delete(id) {
    try {
      await this.http.delete(`/budgets/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error, `Failed to delete budget ${id}`);
    }
  }
  /**
   * Approve a budget
   */
  async approve(id) {
    try {
      return await this.update(id, { status: "approved" });
    } catch (error) {
      throw this.handleError(error, `Failed to approve budget ${id}`);
    }
  }
  /**
   * Reject a budget
   */
  async reject(id) {
    try {
      return await this.update(id, { status: "rejected" });
    } catch (error) {
      throw this.handleError(error, `Failed to reject budget ${id}`);
    }
  }
  /**
   * Convert budget to invoice
   */
  async convertToInvoice(id) {
    try {
      const response = await this.http.post(`/budgets/${id}/convert`);
      if (!response.data.data) {
        throw new SimpleFACTError(
          "Failed to convert budget to invoice",
          "API_ERROR"
        );
      }
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to convert budget ${id} to invoice`);
    }
  }
  /**
   * Search budgets by number, client name, or description
   */
  async search(query, limit = 10) {
    try {
      const params = {
        search: query,
        limit: Math.min(limit, 100)
      };
      return await this.list(params);
    } catch (error) {
      throw this.handleError(error, "Failed to search budgets");
    }
  }
  /**
   * Get budgets by status
   */
  async getByStatus(status, limit = 50) {
    try {
      return await this.list({ status, limit });
    } catch (error) {
      throw this.handleError(error, `Failed to get budgets with status ${status}`);
    }
  }
  /**
   * Get pending budgets
   */
  async getPending(limit = 50) {
    try {
      return await this.getByStatus("pending", limit);
    } catch (error) {
      throw this.handleError(error, "Failed to get pending budgets");
    }
  }
  /**
   * Get approved budgets
   */
  async getApproved(limit = 50) {
    try {
      return await this.getByStatus("approved", limit);
    } catch (error) {
      throw this.handleError(error, "Failed to get approved budgets");
    }
  }
  /**
   * Get expired budgets
   */
  async getExpired(limit = 50) {
    try {
      return await this.list({ expired_only: true, limit });
    } catch (error) {
      throw this.handleError(error, "Failed to get expired budgets");
    }
  }
  /**
   * Get budgets for a specific client
   */
  async getByClient(clientId, limit = 50) {
    try {
      return await this.list({ client_id: clientId, limit });
    } catch (error) {
      throw this.handleError(error, `Failed to get budgets for client ${clientId}`);
    }
  }
  /**
   * Get budgets for a specific time period
   */
  async getByDateRange(dateFrom, dateTo, limit = 50) {
    try {
      return await this.list({ start_date: dateFrom, end_date: dateTo, limit });
    } catch (error) {
      throw this.handleError(error, "Failed to get budgets by date range");
    }
  }
  /**
   * Get budget statistics
   */
  async getStatistics() {
    try {
      const budgets = await this.list({ limit: 1e3 });
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
      budgets.forEach((budget) => {
        stats.totalAmount += budget.total || 0;
        switch (budget.status) {
          case "pending":
            stats.pending++;
            stats.pendingAmount += budget.total || 0;
            break;
          case "approved":
            stats.approved++;
            stats.approvedAmount += budget.total || 0;
            break;
          case "rejected":
            stats.rejected++;
            break;
          case "invoiced":
            stats.converted++;
            break;
          case "expired":
            stats.expired++;
            break;
        }
      });
      if (stats.approved > 0) {
        stats.conversionRate = stats.converted / stats.approved * 100;
      }
      return stats;
    } catch (error) {
      throw this.handleError(error, "Failed to get budget statistics");
    }
  }
  /**
   * Duplicate a budget
   */
  async duplicate(id, newClientId) {
    try {
      const original = await this.get(id);
      const duplicateData = {
        client_id: newClientId || original.client?.id || original.client_id,
        issue_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        // Today's date
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        // 30 days from now
        notes: original.notes ? `Duplicated from budget ${original.budget_number}. ${original.notes}` : `Duplicated from budget ${original.budget_number}`,
        items: original.items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate
        })) || []
      };
      return await this.create(duplicateData);
    } catch (error) {
      throw this.handleError(error, `Failed to duplicate budget ${id}`);
    }
  }
  /**
   * Validate budget data before creation/update
   */
  validateBudgetData(data) {
    if ("client_id" in data && (!data.client_id || data.client_id <= 0)) {
      throw new SimpleFACTError(
        "Valid client ID is required",
        "INVALID_CLIENT_ID"
      );
    }
    if ("issue_date" in data && data.issue_date) {
      const date = new Date(data.issue_date);
      if (isNaN(date.getTime())) {
        throw new SimpleFACTError(
          "Invalid issue_date format",
          "INVALID_ITEM"
        );
      }
    }
    if ("expiry_date" in data && data.expiry_date) {
      const expiryDate = new Date(data.expiry_date);
      if (isNaN(expiryDate.getTime())) {
        throw new SimpleFACTError(
          "Invalid expiry_date format",
          "INVALID_ITEM"
        );
      }
      if (data.issue_date) {
        const issueDate = new Date(data.issue_date);
        if (expiryDate <= issueDate) {
          throw new SimpleFACTError(
            "Expiry date must be after the issue date",
            "INVALID_ITEM"
          );
        }
      }
    }
    if ("items" in data && data.items) {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new SimpleFACTError(
          "At least one item is required",
          "NO_ITEMS"
        );
      }
      data.items.forEach((item, index) => {
        if (!item.description || item.description.trim().length === 0) {
          throw new SimpleFACTError(
            `Item ${index + 1}: Description is required`,
            "INVALID_ITEM"
          );
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new SimpleFACTError(
            `Item ${index + 1}: Quantity must be greater than 0`,
            "INVALID_ITEM"
          );
        }
        if (item.unit_price === void 0 || item.unit_price < 0) {
          throw new SimpleFACTError(
            `Item ${index + 1}: Unit price must be 0 or greater`,
            "INVALID_ITEM"
          );
        }
      });
    }
  }
  /**
   * Handle and transform errors
   */
  handleError(error, defaultMessage) {
    if (error instanceof SimpleFACTError) {
      return error;
    }
    if (error.response) {
      const { status, data } = error.response;
      if (status === 404) {
        return new SimpleFACTError(
          "Budget not found",
          "BUDGET_NOT_FOUND",
          404
        );
      }
      if (status === 409 && data?.error?.code === "BUDGET_ALREADY_INVOICED") {
        return new SimpleFACTError(
          "Budget has already been converted to an invoice",
          "BUDGET_ALREADY_INVOICED",
          409,
          data.error.details
        );
      }
      return new SimpleFACTError(
        data?.error?.message || defaultMessage,
        data?.error?.code || "API_ERROR",
        status,
        data?.error?.details
      );
    }
    return new SimpleFACTError(
      defaultMessage,
      "API_ERROR",
      0,
      { originalError: error }
    );
  }
};

// src/services/ClientPortalService.ts
var ClientPortalService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get client profile information
   */
  async getProfile() {
    try {
      const response = await this.http.get("/client/profile");
      if (!response.data.data) {
        throw new SimpleFACTError(
          "Client profile not found or access denied",
          "CLIENT_NOT_FOUND" /* CLIENT_NOT_FOUND */,
          404
        );
      }
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to get client profile");
    }
  }
  /**
   * Update client profile information
   */
  async updateProfile(profileData) {
    try {
      this.validateProfileData(profileData);
      await this.http.put("/client/profile", profileData);
      return true;
    } catch (error) {
      throw this.handleError(error, "Failed to update client profile");
    }
  }
  /**
   * Change client password
   */
  async changePassword(passwordData) {
    try {
      this.validatePasswordData(passwordData);
      await this.http.post("/client/change-password", passwordData);
      return true;
    } catch (error) {
      throw this.handleError(error, "Failed to change password");
    }
  }
  /**
   * Get client's invoices
   */
  async getInvoices(params) {
    try {
      const response = await this.http.get("/client/invoices", { params });
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
      const statistics = {
        total_invoices: invoices.length,
        total_paid: invoices.filter((inv) => inv.status === "paid").length,
        total_pending: invoices.filter((inv) => ["sent", "viewed"].includes(inv.status)).length,
        total_overdue: invoices.filter((inv) => inv.status === "overdue").length,
        total_amount: invoices.reduce((sum, inv) => sum + inv.total, 0),
        average_amount: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0
      };
      return {
        invoices,
        statistics
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get client invoices");
    }
  }
  /**
   * Get client's budgets
   */
  async getBudgets(params) {
    try {
      const response = await this.http.get("/client/budgets", { params });
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
      const statistics = {
        total_budgets: budgets.length,
        total_approved: budgets.filter((budget) => budget.status === "approved").length,
        total_pending: budgets.filter((budget) => budget.status === "pending").length,
        total_rejected: budgets.filter((budget) => budget.status === "rejected").length,
        total_converted: budgets.filter((budget) => budget.status === "invoiced").length,
        expired_budgets: budgets.filter((budget) => budget.status === "expired").length,
        recent: {
          count: budgets.slice(0, 5).length,
          total: budgets.slice(0, 5).reduce((sum, budget) => sum + (budget.total || 0), 0)
        }
      };
      return {
        budgets,
        statistics
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get client budgets");
    }
  }
  /**
   * Download document PDF (invoice or budget)
   */
  async downloadDocument(documentId, type) {
    try {
      const response = await this.http.get(
        `/client/documents/${documentId}/pdf?type=${type}`,
        { responseType: "blob" }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to download ${type} PDF`);
    }
  }
  /**
   * Get pending invoices for client
   */
  async getPendingInvoices() {
    try {
      const { invoices } = await this.getInvoices({ status: "pending", limit: 50 });
      return invoices;
    } catch (error) {
      throw this.handleError(error, "Failed to get pending invoices");
    }
  }
  /**
   * Get paid invoices for client
   */
  async getPaidInvoices(limit = 20) {
    try {
      const { invoices } = await this.getInvoices({ status: "paid", limit });
      return invoices;
    } catch (error) {
      throw this.handleError(error, "Failed to get paid invoices");
    }
  }
  /**
   * Get overdue invoices for client
   */
  async getOverdueInvoices() {
    try {
      const { invoices } = await this.getInvoices({ status: "overdue", limit: 50 });
      return invoices;
    } catch (error) {
      throw this.handleError(error, "Failed to get overdue invoices");
    }
  }
  /**
   * Get recent activity (invoices and budgets)
   */
  async getRecentActivity(limit = 10) {
    try {
      const [invoicesResult, budgetsResult] = await Promise.all([
        this.getInvoices({ limit: Math.ceil(limit / 2), sort_by: "created_at", sort_direction: "desc" }),
        this.getBudgets({ limit: Math.ceil(limit / 2), sort_by: "created_at", sort_direction: "desc" })
      ]);
      return {
        invoices: invoicesResult.invoices,
        budgets: budgetsResult.budgets
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get recent activity");
    }
  }
  /**
   * Get client dashboard summary
   */
  async getDashboardSummary() {
    try {
      const [profile, invoicesResult, budgetsResult] = await Promise.all([
        this.getProfile(),
        this.getInvoices({ limit: 5, sort_by: "created_at", sort_direction: "desc" }),
        this.getBudgets({ limit: 5, sort_by: "created_at", sort_direction: "desc" })
      ]);
      return {
        profile,
        pendingInvoices: invoicesResult.invoices.filter((inv) => inv.status === "sent" || inv.status === "viewed"),
        recentBudgets: budgetsResult.budgets,
        statistics: {
          totalInvoices: invoicesResult.statistics.total_invoices,
          totalBudgets: budgetsResult.statistics.total_budgets,
          totalPaid: invoicesResult.statistics.total_paid,
          totalPending: invoicesResult.statistics.total_pending
        }
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get dashboard summary");
    }
  }
  /**
   * Search client's documents
   */
  async searchDocuments(query, type) {
    try {
      const searchParams = { search: query, limit: 20 };
      if (type === "invoices") {
        const invoicesResult2 = await this.getInvoices(searchParams);
        return { invoices: invoicesResult2.invoices, budgets: [] };
      }
      if (type === "budgets") {
        const budgetsResult2 = await this.getBudgets(searchParams);
        return { invoices: [], budgets: budgetsResult2.budgets };
      }
      const [invoicesResult, budgetsResult] = await Promise.all([
        this.getInvoices(searchParams),
        this.getBudgets(searchParams)
      ]);
      return {
        invoices: invoicesResult.invoices,
        budgets: budgetsResult.budgets
      };
    } catch (error) {
      throw this.handleError(error, "Failed to search documents");
    }
  }
  /**
   * Validate profile update data
   */
  validateProfileData(data) {
    if (!data.name || data.name.trim().length === 0) {
      throw new SimpleFACTError(
        "Name is required and cannot be empty",
        "MISSING_FIELD" /* MISSING_FIELD */
      );
    }
    if (data.name.length > 200) {
      throw new SimpleFACTError(
        "Name is too long (max 200 characters)",
        "INVALID_ITEM" /* INVALID_ITEM */
      );
    }
    if (data.phone && data.phone.length > 20) {
      throw new SimpleFACTError(
        "Phone number is too long (max 20 characters)",
        "INVALID_ITEM" /* INVALID_ITEM */
      );
    }
    if (data.address && data.address.length > 500) {
      throw new SimpleFACTError(
        "Address is too long (max 500 characters)",
        "INVALID_ITEM" /* INVALID_ITEM */
      );
    }
    if (data.postal_code && !/^\d{5}$/.test(data.postal_code)) {
      throw new SimpleFACTError(
        "Postal code must be 5 digits",
        "INVALID_ITEM" /* INVALID_ITEM */
      );
    }
  }
  /**
   * Validate password change data
   */
  validatePasswordData(data) {
    if (!data.current_password) {
      throw new SimpleFACTError(
        "Current password is required",
        "MISSING_FIELD" /* MISSING_FIELD */
      );
    }
    if (!data.new_password) {
      throw new SimpleFACTError(
        "New password is required",
        "MISSING_FIELD" /* MISSING_FIELD */
      );
    }
    if (data.new_password !== data.confirm_password) {
      throw new SimpleFACTError(
        "New password and confirmation do not match",
        "INVALID_ITEM" /* INVALID_ITEM */
      );
    }
    if (data.new_password.length < 8) {
      throw new SimpleFACTError(
        "New password must be at least 8 characters long",
        "INVALID_ITEM" /* INVALID_ITEM */
      );
    }
    if (data.current_password === data.new_password) {
      throw new SimpleFACTError(
        "New password must be different from current password",
        "INVALID_ITEM" /* INVALID_ITEM */
      );
    }
  }
  /**
   * Handle and transform errors
   */
  handleError(error, defaultMessage) {
    if (error instanceof SimpleFACTError) {
      return error;
    }
    if (error.response) {
      const { status, data } = error.response;
      if (status === 403) {
        return new SimpleFACTError(
          "Access denied. Client portal access not enabled.",
          "INSUFFICIENT_PERMISSIONS" /* INSUFFICIENT_PERMISSIONS */,
          403
        );
      }
      if (status === 404) {
        return new SimpleFACTError(
          "Client not found or access not enabled",
          "CLIENT_NOT_FOUND" /* CLIENT_NOT_FOUND */,
          404
        );
      }
      if (status === 400 && data?.error?.code === "EMAIL_MODIFICATION_NOT_ALLOWED") {
        return new SimpleFACTError(
          "Email modification is not allowed. Contact your company for email changes.",
          "INVALID_ITEM" /* INVALID_ITEM */,
          400
        );
      }
      return new SimpleFACTError(
        data?.error?.message || defaultMessage,
        data?.error?.code || "API_ERROR" /* API_ERROR */,
        status,
        data?.error?.details
      );
    }
    return new SimpleFACTError(
      defaultMessage,
      "API_ERROR" /* API_ERROR */,
      0,
      { originalError: error }
    );
  }
};

// src/services/InvoicesService.ts
var InvoicesService = class {
  constructor(client) {
    this.client = client;
  }
  // Accept SimpleFACTClient instead of AxiosInstance
  /**
   * Get all invoices with optional filters
   */
  async getAll(params = {}) {
    try {
      const response = await this.client.request({
        method: "GET",
        url: "/api/v1/invoices",
        params
      });
      return response;
    } catch (error) {
      throw new SimpleFACTError(
        `Error fetching invoices: ${error instanceof Error ? error.message : "Unknown error"}`,
        "SERVER_ERROR",
        500,
        error
      );
    }
  }
  /**
   * Get invoice by ID
   */
  async getById(id) {
    try {
      const response = await this.client.request({
        method: "GET",
        url: `/api/v1/invoices/${id}`
      });
      return response;
    } catch (error) {
      throw new SimpleFACTError(
        `Invoice with ID ${id} not found`,
        "NOT_FOUND_ERROR",
        404,
        error
      );
    }
  }
  /**
   * Create new invoice
   */
  async create(invoiceData) {
    try {
      this.validateInvoiceData(invoiceData);
      const response = await this.client.request({
        method: "POST",
        url: "/api/v1/invoices",
        data: invoiceData
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error creating invoice: ${error instanceof Error ? error.message : "Unknown error"}`,
        "VALIDATION_ERROR",
        400,
        error
      );
    }
  }
  /**
   * Update existing invoice
   */
  async update(id, updates) {
    try {
      if (updates.items && updates.items.length > 0) {
        this.validateItems(updates.items);
      }
      const response = await this.client.request({
        method: "PUT",
        url: `/api/v1/invoices/${id}`,
        data: updates
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error updating invoice ${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NOT_FOUND_ERROR",
        404,
        error
      );
    }
  }
  /**
   * Delete invoice
   */
  async delete(id) {
    try {
      await this.client.request({
        method: "DELETE",
        url: `/api/v1/invoices/${id}`
      });
    } catch (error) {
      throw new SimpleFACTError(
        `Error deleting invoice ${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NOT_FOUND_ERROR",
        404,
        error
      );
    }
  }
  /**
   * Update invoice status
   */
  async updateStatus(id, statusUpdate) {
    try {
      const response = await this.client.request({
        method: "PUT",
        url: `/api/v1/invoices/${id}/status`,
        data: statusUpdate
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error updating invoice status: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NOT_FOUND_ERROR",
        404,
        error
      );
    }
  }
  /**
   * Download invoice PDF
   */
  async downloadPDF(id, options = {}) {
    try {
      const response = await this.client.getHttpClient().request({
        method: "GET",
        url: `/api/v1/invoices/${id}/pdf`,
        responseType: "blob",
        params: options
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error downloading PDF for invoice ${id}`,
        "NOT_FOUND_ERROR",
        404,
        error
      );
    }
  }
  /**
   * Download invoice XML
   */
  async downloadXML(id, options = {}) {
    try {
      const response = await this.client.getHttpClient().request({
        method: "GET",
        url: `/api/v1/invoices/${id}/xml`,
        responseType: "blob",
        params: options
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error downloading XML for invoice ${id}`,
        "NOT_FOUND_ERROR",
        404,
        error
      );
    }
  }
  /**
   * Get invoices by status
   */
  async getByStatus(status, limit = 50) {
    const response = await this.getAll({
      status,
      limit
    });
    return response.data || [];
  }
  /**
   * Get overdue invoices
   */
  async getOverdue(limit = 50) {
    const response = await this.getAll({
      status: "overdue",
      limit
    });
    return response.data || [];
  }
  /**
   * Get paid invoices
   */
  async getPaid(limit = 50) {
    const response = await this.getAll({
      payment_status: "paid",
      limit
    });
    return response.data || [];
  }
  /**
   * Get pending invoices
   */
  async getPending(limit = 50) {
    const response = await this.getAll({
      payment_status: "pending",
      limit
    });
    return response.data || [];
  }
  /**
   * Get invoices by date range
   */
  async getByDateRange(dateFrom, dateTo, limit = 100) {
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
  async getByClient(clientId, limit = 50) {
    const response = await this.getAll({
      client_id: clientId,
      limit
    });
    return response.data || [];
  }
  /**
   * Search invoices by number or client name
   */
  async search(query, limit = 20) {
    const response = await this.getAll({
      search: query,
      limit
    });
    return response.data || [];
  }
  /**
   * Get invoice statistics
   */
  async getStatistics() {
    try {
      const response = await this.getAll({ limit: 1e3 });
      const invoices = response.data || [];
      const stats = {
        totalInvoices: invoices.length,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        averageAmount: 0
      };
      invoices.forEach((invoice) => {
        const total = invoice.total || 0;
        stats.totalAmount += total;
        switch (invoice.status) {
          case "paid":
            stats.paidAmount += total;
            break;
          case "sent":
          case "viewed":
            stats.pendingAmount += invoice.remaining_amount || 0;
            break;
          case "overdue":
            stats.overdueAmount += invoice.remaining_amount || 0;
            break;
        }
      });
      stats.averageAmount = stats.totalInvoices > 0 ? stats.totalAmount / stats.totalInvoices : 0;
      return stats;
    } catch (error) {
      throw new SimpleFACTError(
        "Error calculating invoice statistics",
        "SERVER_ERROR",
        500,
        error
      );
    }
  }
  // Validation methods
  validateInvoiceData(data) {
    if (!data.client_id || typeof data.client_id !== "number") {
      throw new SimpleFACTError(
        "Valid client ID is required",
        "VALIDATION_ERROR"
      );
    }
    if (!data.issue_date) {
      throw new SimpleFACTError(
        "Issue date is required",
        "VALIDATION_ERROR"
      );
    }
    if (!data.due_date) {
      throw new SimpleFACTError(
        "Due date is required",
        "VALIDATION_ERROR"
      );
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new SimpleFACTError(
        "At least one invoice item is required",
        "VALIDATION_ERROR"
      );
    }
    this.validateItems(data.items);
    this.validateDates(data.issue_date, data.due_date);
  }
  validateItems(items) {
    items.forEach((item, index) => {
      if (!item.description || typeof item.description !== "string" || item.description.trim().length === 0) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Description is required`,
          "VALIDATION_ERROR"
        );
      }
      if (!item.quantity || typeof item.quantity !== "number" || item.quantity <= 0) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Valid quantity is required`,
          "VALIDATION_ERROR"
        );
      }
      if (item.unit_price === void 0 || typeof item.unit_price !== "number" || item.unit_price < 0) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Valid unit price is required`,
          "VALIDATION_ERROR"
        );
      }
      if (item.tax_rate !== void 0 && (typeof item.tax_rate !== "number" || item.tax_rate < 0 || item.tax_rate > 100)) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Tax rate must be between 0 and 100`,
          "VALIDATION_ERROR"
        );
      }
      if (item.discount !== void 0 && (typeof item.discount !== "number" || item.discount < 0 || item.discount > 100)) {
        throw new SimpleFACTError(
          `Item ${index + 1}: Discount must be between 0 and 100`,
          "VALIDATION_ERROR"
        );
      }
    });
  }
  validateDates(issueDate, dueDate) {
    const issue = new Date(issueDate);
    const due = new Date(dueDate);
    if (isNaN(issue.getTime())) {
      throw new SimpleFACTError(
        "Invalid issue date format",
        "VALIDATION_ERROR"
      );
    }
    if (isNaN(due.getTime())) {
      throw new SimpleFACTError(
        "Invalid due date format",
        "VALIDATION_ERROR"
      );
    }
    if (due < issue) {
      throw new SimpleFACTError(
        "Due date cannot be before issue date",
        "VALIDATION_ERROR"
      );
    }
  }
};

// src/services/PaymentsService.ts
var PaymentsService = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all payments for a specific invoice
   */
  async listByInvoice(invoiceId) {
    try {
      const response = await this.http.get(`/invoices/${invoiceId}/payments`);
      const payments = response.data.data || [];
      const mockInvoice = payments.length > 0 ? {
        id: payments[0].invoice_id,
        invoice_number: `INV-${payments[0].invoice_id}`,
        total: payments.reduce((sum, p) => sum + p.amount, 0),
        total_paid: payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
        remaining_amount: 0,
        payment_status: "pending"
      } : {
        id: invoiceId,
        invoice_number: `INV-${invoiceId}`,
        total: 0,
        total_paid: 0,
        remaining_amount: 0,
        payment_status: "pending"
      };
      return {
        payments,
        invoice: mockInvoice
      };
    } catch (error) {
      throw this.handleError(error, `Failed to list payments for invoice ${invoiceId}`);
    }
  }
  /**
   * Register a new payment for an invoice
   */
  async create(paymentData) {
    try {
      this.validatePaymentData(paymentData);
      const response = await this.http.post(`/invoices/${paymentData.invoice_id}/payments`, paymentData);
      if (!response.data.data) {
        throw new SimpleFACTError(
          "Failed to create payment - no data returned",
          "API_ERROR"
        );
      }
      const payment = response.data.data;
      const mockInvoice = {
        id: payment.invoice_id,
        invoice_number: `INV-${payment.invoice_id}`,
        total: payment.amount,
        // This would be more accurate with real data
        total_paid: payment.amount,
        remaining_amount: 0,
        payment_status: "paid"
      };
      return {
        payment,
        invoice: mockInvoice
      };
    } catch (error) {
      throw this.handleError(error, `Failed to create payment for invoice ${paymentData.invoice_id}`);
    }
  }
  /**
   * Update an existing payment
   */
  async update(invoiceId, paymentId, paymentData) {
    try {
      if (Object.keys(paymentData).length === 0) {
        throw new SimpleFACTError(
          "No data provided for update",
          "MISSING_FIELD"
        );
      }
      const updateData = {
        payment_id: paymentId,
        ...paymentData
      };
      await this.http.put(`/invoices/${invoiceId}/payments`, updateData);
      return true;
    } catch (error) {
      throw this.handleError(error, `Failed to update payment ${paymentId}`);
    }
  }
  /**
   * Delete a payment
   */
  async delete(invoiceId, paymentId) {
    try {
      await this.http.delete(`/invoices/${invoiceId}/payments?payment_id=${paymentId}`);
      return true;
    } catch (error) {
      throw this.handleError(error, `Failed to delete payment ${paymentId}`);
    }
  }
  /**
   * Get payment statistics for an invoice
   */
  async getInvoicePaymentStats(invoiceId) {
    try {
      const { payments } = await this.listByInvoice(invoiceId);
      const stats = {
        totalPaid: 0,
        remainingAmount: 0,
        paymentCount: payments.length,
        lastPaymentDate: void 0,
        paymentMethods: []
      };
      let lastDate = null;
      const methodStats = /* @__PURE__ */ new Map();
      payments.forEach((payment) => {
        stats.totalPaid += payment.amount;
        const paymentDate = new Date(payment.payment_date);
        if (!lastDate || paymentDate > lastDate) {
          lastDate = paymentDate;
          stats.lastPaymentDate = payment.payment_date;
        }
        const existing = methodStats.get(payment.payment_method) || { count: 0, amount: 0 };
        methodStats.set(payment.payment_method, {
          count: existing.count + 1,
          amount: existing.amount + payment.amount
        });
      });
      stats.paymentMethods = Array.from(methodStats.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      }));
      return stats;
    } catch (error) {
      throw this.handleError(error, `Failed to get payment statistics for invoice ${invoiceId}`);
    }
  }
  /**
   * Register full payment for an invoice
   */
  async payInFull(invoiceId, paymentMethod = "bank_transfer", reference, notes) {
    try {
      const invoice = await this.http.get(`/invoices/${invoiceId}`);
      const remainingAmount = invoice.data.data?.remaining_amount || 0;
      if (remainingAmount <= 0) {
        throw new SimpleFACTError(
          "Invoice is already fully paid",
          "INVALID_AMOUNT"
        );
      }
      const paymentData = {
        invoice_id: invoiceId,
        amount: remainingAmount,
        payment_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        // Today's date
        payment_method: paymentMethod,
        reference,
        notes: notes || "Full payment"
      };
      return await this.create(paymentData);
    } catch (error) {
      throw this.handleError(error, `Failed to pay invoice ${invoiceId} in full`);
    }
  }
  /**
   * Get all payment methods used by a company
   */
  async getUsedPaymentMethods() {
    try {
      const commonMethods = [
        "bank_transfer",
        "cash",
        "credit_card",
        "check",
        "other"
      ];
      return commonMethods;
    } catch (error) {
      throw this.handleError(error, "Failed to get payment methods");
    }
  }
  /**
   * Validate payment data before creation/update
   */
  validatePaymentData(data) {
    if ("amount" in data && data.amount !== void 0) {
      if (data.amount <= 0) {
        throw new SimpleFACTError(
          "Payment amount must be greater than 0",
          "INVALID_AMOUNT"
        );
      }
      if (data.amount > 999999.99) {
        throw new SimpleFACTError(
          "Payment amount is too large",
          "INVALID_AMOUNT"
        );
      }
    }
    if ("payment_date" in data && data.payment_date) {
      const date = new Date(data.payment_date);
      if (isNaN(date.getTime())) {
        throw new SimpleFACTError(
          "Invalid payment date format",
          "INVALID_ITEM"
        );
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        throw new SimpleFACTError(
          "Payment date cannot be in the future",
          "INVALID_ITEM"
        );
      }
    }
    if ("payment_method" in data && data.payment_method) {
      const validMethods = [
        "cash",
        "bank_transfer",
        "credit_card",
        "check",
        "other"
      ];
      if (!validMethods.includes(data.payment_method)) {
        throw new SimpleFACTError(
          `Invalid payment method. Valid methods: ${validMethods.join(", ")}`,
          "INVALID_ITEM"
        );
      }
    }
    if (data.reference && data.reference.length > 100) {
      throw new SimpleFACTError(
        "Payment reference is too long (max 100 characters)",
        "INVALID_ITEM"
      );
    }
    if (data.notes && data.notes.length > 500) {
      throw new SimpleFACTError(
        "Payment notes are too long (max 500 characters)",
        "INVALID_ITEM"
      );
    }
  }
  /**
   * Handle and transform errors
   */
  handleError(error, defaultMessage) {
    if (error instanceof SimpleFACTError) {
      return error;
    }
    if (error.response) {
      const { status, data } = error.response;
      if (status === 404) {
        if (data?.error?.code === "INVOICE_NOT_FOUND") {
          return new SimpleFACTError(
            "Invoice not found",
            "INVOICE_NOT_FOUND",
            404
          );
        }
        return new SimpleFACTError(
          "Payment not found",
          "PAYMENT_NOT_FOUND",
          404
        );
      }
      if (status === 409 && data?.error?.code === "PAYMENT_EXCEEDS_REMAINING") {
        return new SimpleFACTError(
          "Payment amount exceeds remaining invoice amount",
          "PAYMENT_EXCEEDS_REMAINING",
          409,
          data.error.details
        );
      }
      return new SimpleFACTError(
        data?.error?.message || defaultMessage,
        data?.error?.code || "API_ERROR",
        status,
        data?.error?.details
      );
    }
    return new SimpleFACTError(
      defaultMessage,
      "API_ERROR",
      0,
      { originalError: error }
    );
  }
};

// src/hooks/index.ts
var import_react = require("react");
var globalClient = null;
function setSimpleFACTClient(client) {
  globalClient = client;
}
function getSimpleFACTClient() {
  if (!globalClient) {
    throw new Error("SimpleFact client not initialized. Call setSimpleFACTClient() first.");
  }
  return globalClient;
}
function useResource(fetcher, options = {}) {
  const [data, setData] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const isMountedRef = (0, import_react.useRef)(true);
  const fetchData = (0, import_react.useCallback)(async () => {
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
        const error2 = err;
        setError(error2);
        options.on_error?.(error2);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher, options.on_success, options.on_error]);
  const mutate = (0, import_react.useCallback)((newData) => {
    if (isMountedRef.current) {
      setData(newData);
    }
  }, []);
  (0, import_react.useEffect)(() => {
    if (options.auto_fetch !== false) {
      fetchData();
    }
  }, [fetchData, options.auto_fetch]);
  (0, import_react.useEffect)(() => {
    if (options.refresh_interval && options.refresh_interval > 0) {
      const interval = setInterval(fetchData, options.refresh_interval);
      return () => clearInterval(interval);
    }
    return void 0;
  }, [fetchData, options.refresh_interval]);
  (0, import_react.useEffect)(() => {
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
function useListResource(listFetcher, createFetcher, updateFetcher, deleteFetcher, options = {}) {
  const [filters, setFilters] = (0, import_react.useState)({});
  const [pagination, setPagination] = (0, import_react.useState)(null);
  const { data, loading, error, refresh, mutate } = useResource(
    async () => {
      const result = await listFetcher();
      setPagination(result.meta || null);
      return result.data;
    },
    options
  );
  const create = (0, import_react.useCallback)(async (item) => {
    const newItem = await createFetcher(item);
    if (data) {
      mutate([...data, newItem]);
    }
    return newItem;
  }, [data, mutate, createFetcher]);
  const update = (0, import_react.useCallback)(async (id, updates) => {
    const updatedItem = await updateFetcher(id, updates);
    if (data) {
      mutate(data.map((item) => item.id === id ? updatedItem : item));
    }
    return updatedItem;
  }, [data, mutate, updateFetcher]);
  const remove = (0, import_react.useCallback)(async (id) => {
    await deleteFetcher(id);
    if (data) {
      mutate(data.filter((item) => item.id !== id));
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
function useClients(params = {}) {
  const client = getSimpleFACTClient();
  return useListResource(
    async () => {
      const response = await client.clients.getAll(params);
      return { data: response.data || [], meta: response.meta };
    },
    (data) => client.clients.create(data),
    (id, updates) => client.clients.update(id, updates),
    (id) => client.clients.delete(id)
  );
}
function useClient(id, options = {}) {
  const client = getSimpleFACTClient();
  return useResource(
    async () => {
      const response = await client.clients.getById(id);
      return response.data;
    },
    options
  );
}
function useBudgets(params = {}) {
  const client = getSimpleFACTClient();
  return useListResource(
    async () => {
      const response = await client.budgets.getAll(params);
      return { data: response.data || [], meta: response.meta };
    },
    (data) => client.budgets.create(data),
    (id, updates) => client.budgets.update(id, updates),
    (id) => client.budgets.delete(id)
  );
}
function useBudget(id, options = {}) {
  const client = getSimpleFACTClient();
  return useResource(
    async () => {
      const response = await client.budgets.getById(id);
      return response.data;
    },
    options
  );
}
function useInvoices(params = {}) {
  const client = getSimpleFACTClient();
  return useListResource(
    async () => {
      const response = await client.invoices.getAll(params);
      return { data: response.data || [], meta: response.meta };
    },
    (data) => client.invoices.create(data),
    (id, updates) => client.invoices.update(id, updates),
    (id) => client.invoices.delete(id)
  );
}
function useInvoice(id, options = {}) {
  const client = getSimpleFACTClient();
  return useResource(
    async () => {
      const response = await client.invoices.getById(id);
      return response.data;
    },
    options
  );
}
function usePayments(params = {}) {
  const client = getSimpleFACTClient();
  const baseListResult = useListResource(
    async () => {
      const response = await client.payments.getAll(params);
      return { data: response.data || [], meta: response.meta };
    },
    (data) => client.payments.create(data),
    (id, updates) => client.payments.update(id, updates),
    (id) => client.payments.delete(id)
  );
  const create = (0, import_react.useCallback)(async (invoiceId, paymentData) => {
    const fullPaymentData = {
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
function useClientProfile(options = {}) {
  const client = getSimpleFACTClient();
  return useResource(
    async () => {
      const response = await client.clientPortal.getProfile();
      return response.data || response;
    },
    options
  );
}
function useClientActivity(options = {}) {
  const client = getSimpleFACTClient();
  return useResource(
    async () => {
      const response = await client.clientPortal.getActivitySummary();
      return response.data || response;
    },
    options
  );
}
function useVerification(code, options = {}) {
  const client = getSimpleFACTClient();
  return useResource(
    async () => {
      const response = await client.verification.verifyInvoice(code);
      return response.data || response;
    },
    options
  );
}
function useRateLimit() {
  const client = getSimpleFACTClient();
  const [rateLimitInfo, setRateLimitInfo] = (0, import_react.useState)(client.getRateLimitInfo());
  (0, import_react.useEffect)(() => {
    const interval = setInterval(() => {
      setRateLimitInfo(client.getRateLimitInfo());
    }, 1e3);
    return () => clearInterval(interval);
  }, [client]);
  return rateLimitInfo;
}
function useHealthCheck(options = {}) {
  const client = getSimpleFACTClient();
  return useResource(
    async () => {
      const response = await client.getHealthCheck();
      return response.data || response;
    },
    { refresh_interval: 3e4, ...options }
  );
}
function useDownload() {
  const client = getSimpleFACTClient();
  const [downloading, setDownloading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const downloadInvoicePDF = (0, import_react.useCallback)(async (invoiceId, filename) => {
    setDownloading(true);
    setError(null);
    try {
      await client.invoices.downloadPDF(invoiceId, { filename });
    } catch (err) {
      setError(err);
    } finally {
      setDownloading(false);
    }
  }, [client]);
  const downloadBudgetPDF = (0, import_react.useCallback)(async (budgetId, filename) => {
    setDownloading(true);
    setError(null);
    try {
      await client.budgets.downloadPDF(budgetId, { filename });
    } catch (err) {
      setError(err);
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
function useUpdateClientProfile() {
  const client = getSimpleFACTClient();
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const updateProfile = (0, import_react.useCallback)(async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.clientPortal.updateProfile(profileData);
      return response.data || response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);
  const changePassword = (0, import_react.useCallback)(async (passwordData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.clientPortal.changePassword(passwordData);
      return response.data || response;
    } catch (err) {
      setError(err);
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

// src/index.ts
var mockAxios = {
  create: () => ({
    get: () => Promise.resolve({ data: { data: [] } }),
    post: () => Promise.resolve({ data: { data: {} } }),
    put: () => Promise.resolve({ data: { data: {} } }),
    delete: () => Promise.resolve({ data: { success: true } }),
    request: () => Promise.resolve({ data: { data: [] } })
  })
};
var SimpleFACTClient = class {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.apiToken = config.apiToken || config.apiKey;
    this.timeout = config.timeout || 3e4;
    this.debug = config.debug || false;
    this.rateLimitPerHour = config.rateLimitPerHour || 1e3;
    this.autoRefreshToken = config.autoRefreshToken !== false;
    this.httpClient = mockAxios.create();
    this.clients = {
      getAll: (params) => this.get("/clients", { params }),
      getById: (id) => this.get(`/clients/${id}`),
      create: (data) => this.post("/clients", data),
      update: (id, data) => this.put(`/clients/${id}`, data),
      delete: (id) => this.delete(`/clients/${id}`)
    };
    this.invoices = new InvoicesService(this);
    this.budgets = new BudgetsService(this.httpClient);
    this.payments = new PaymentsService(this.httpClient);
    this.clientPortal = new ClientPortalService(this.httpClient);
    this.verification = {
      verifyInvoice: (hash) => this.get(`/verify/${hash}`)
    };
  }
  // HTTP methods
  async get(url, config) {
    const result = await this.request({ method: "GET", url, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }
  async post(url, data, config) {
    const result = await this.request({ method: "POST", url, data, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }
  async put(url, data, config) {
    const result = await this.request({ method: "PUT", url, data, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }
  async delete(url, config) {
    const result = await this.request({ method: "DELETE", url, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }
  async patch(url, data, config) {
    const result = await this.request({ method: "PATCH", url, data, ...config });
    return {
      success: true,
      data: result.data,
      meta: result.meta
    };
  }
  async request(config) {
    return {
      data: [],
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
  getHttpClient() {
    return this.httpClient;
  }
  // Utility methods
  async refreshToken() {
    if (this.debug) {
      console.log("Token refreshed");
    }
  }
  async getHealthCheck() {
    return {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      services: {
        api: true,
        database: true,
        auth: true
      }
    };
  }
  getRateLimitInfo() {
    return {
      limit: this.rateLimitPerHour,
      remaining: this.rateLimitPerHour - 1,
      resetTime: new Date(Date.now() + 36e5),
      // 1 hour from now
      requestsThisHour: 1
    };
  }
};
var index_default = SimpleFACTClient;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BudgetsService,
  ClientPortalService,
  ErrorCodes,
  InvoicesService,
  PaymentsService,
  SimpleFACTClient,
  SimpleFACTError,
  getSimpleFACTClient,
  setSimpleFACTClient,
  useBudget,
  useBudgets,
  useClient,
  useClientActivity,
  useClientProfile,
  useClients,
  useDownload,
  useHealthCheck,
  useInvoice,
  useInvoices,
  usePayments,
  useRateLimit,
  useUpdateClientProfile,
  useVerification
});
