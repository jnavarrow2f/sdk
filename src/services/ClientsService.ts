// ====================================
// SIMPLEFACT SDK - CLIENTS SERVICE
// Servicio para gestión de clientes v115
// ====================================

import {
  Client,
  ClientsListParams,
  ClientWebAccessData,
  ApiResponse,
  SimpleFACTError,
  ErrorCodes
} from '../types';

export class ClientsService {
  constructor(private client: any) {} // Accept SimpleFACTClient instead of AxiosInstance

  /**
   * Get all clients with optional filters
   */
  async getAll(params: ClientsListParams = {}): Promise<ApiResponse<Client[]>> {
    try {
      const response = await this.client.request({
        method: 'GET',
        url: '/api/v1/clients',
        params
      });
      return response;
    } catch (error) {
      throw new SimpleFACTError(
        `Error fetching clients: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCodes.SERVER_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Get client by ID
   */
  async getById(id: number): Promise<ApiResponse<Client>> {
    try {
      const response = await this.client.request({
        method: 'GET',
        url: `/api/v1/clients/${id}`
      });
      return response;
    } catch (error) {
      throw new SimpleFACTError(
        `Client with ID ${id} not found`,
        ErrorCodes.CLIENT_NOT_FOUND,
        404,
        error
      );
    }
  }

  /**
   * Create new client
   */
  async create(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    try {
      this.validateClientData(clientData);

      const response = await this.client.request({
        method: 'POST',
        url: '/api/v1/clients',
        data: clientData
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error creating client: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCodes.VALIDATION_ERROR,
        400,
        error
      );
    }
  }

  /**
   * Update existing client
   */
  async update(id: number, updates: Partial<Client>): Promise<Client> {
    try {
      if (updates.name) this.validateName(updates.name);
      if (updates.email) this.validateEmail(updates.email);
      if (updates.tax_id) this.validateTaxId(updates.tax_id);

      const response = await this.client.request({
        method: 'PUT',
        url: `/api/v1/clients/${id}`,
        data: updates
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error updating client ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCodes.CLIENT_NOT_FOUND,
        404,
        error
      );
    }
  }

  /**
   * Delete client
   */
  async delete(id: number): Promise<void> {
    try {
      await this.client.request({
        method: 'DELETE',
        url: `/api/v1/clients/${id}`
      });
    } catch (error) {
      throw new SimpleFACTError(
        `Error deleting client ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCodes.CLIENT_NOT_FOUND,
        404,
        error
      );
    }
  }

  /**
   * Search clients by name or email
   */
  async search(query: string, limit: number = 10): Promise<Client[]> {
    const response = await this.getAll({
      search: query,
      limit
    });
    return response.data || [];
  }

  /**
   * Get active clients only
   */
  async getActive(limit: number = 100): Promise<Client[]> {
    const response = await this.getAll({
      status: 'active',
      limit
    });
    return response.data || [];
  }

  /**
   * Get inactive clients only
   */
  async getInactive(limit: number = 100): Promise<Client[]> {
    const response = await this.getAll({
      status: 'inactive',
      limit
    });
    return response.data || [];
  }

  /**
   * Enable/disable web access for client
   */
  async setWebAccess(id: number, accessData: ClientWebAccessData): Promise<Client> {
    try {
      const response = await this.client.request({
        method: 'POST',
        url: `/api/v1/clients/${id}/web-access`,
        data: accessData
      });
      return response.data;
    } catch (error) {
      throw new SimpleFACTError(
        `Error setting web access for client ${id}`,
        ErrorCodes.CLIENT_NOT_FOUND,
        404,
        error
      );
    }
  }

  // Validation methods
  private validateClientData(data: Omit<Client, 'id' | 'created_at' | 'updated_at'>): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new SimpleFACTError(
        'Client name must be at least 2 characters long',
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      throw new SimpleFACTError(
        'Valid email address is required',
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (!data.address || data.address.trim().length < 5) {
      throw new SimpleFACTError(
        'Address must be at least 5 characters long',
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (!data.city || data.city.trim().length < 2) {
      throw new SimpleFACTError(
        'City is required and must be at least 2 characters long',
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (!data.country || data.country.trim().length < 2) {
      throw new SimpleFACTError(
        'Country is required',
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (data.tax_id && !this.isValidTaxId(data.tax_id)) {
      throw new SimpleFACTError(
        'Invalid tax ID format',
        ErrorCodes.VALIDATION_ERROR
      );
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new SimpleFACTError(
        'Name must be at least 2 characters long',
        ErrorCodes.VALIDATION_ERROR
      );
    }
  }

  private validateEmail(email: string): void {
    if (!email || !this.isValidEmail(email)) {
      throw new SimpleFACTError(
        'Valid email address is required',
        ErrorCodes.VALIDATION_ERROR
      );
    }
  }

  private validateTaxId(taxId: string): void {
    if (!this.isValidTaxId(taxId)) {
      throw new SimpleFACTError(
        'Invalid tax ID format',
        ErrorCodes.VALIDATION_ERROR
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidTaxId(taxId: string): boolean {
    // Basic Spanish NIF/CIF validation
    const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/i;
    return nifRegex.test(taxId) || cifRegex.test(taxId);
  }
}
