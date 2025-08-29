// ====================================
// SIMPLEFACT SDK - REACT EXAMPLE
// Ejemplo completo con Dashboard, CRUD y Monitoreo
// ====================================

import React, { useState, useEffect } from 'react';
import type {
  SimpleFACTClient,
  Client,
  Invoice,
  Payment,
  Budget
} from '../src/types';

// Importar hooks si están disponibles
// import {
//   setSimpleFACTClient,
//   useClients,
//   useInvoices,
//   usePayments,
//   useRateLimit,
//   useHealthCheck,
//   useDownload
// } from '../src/hooks';

// ====================================
// CONFIGURACIÓN INICIAL
// ====================================

// Configurar cliente SDK (llamar una vez al inicio de la app)
const initializeSDK = () => {
  // Mock implementation - replace with actual SimpleFACTClient
  const client = {
    baseURL: 'https://app.simplefact.com',
    apiToken: process.env.REACT_APP_SIMPLEFACT_TOKEN || 'demo-token',
    debug: true,
    autoRefreshToken: true,

    // Mock methods
    clients: {
      getAll: () => Promise.resolve({ data: [] }),
      create: (data: any) => Promise.resolve(data),
      update: (id: number, data: any) => Promise.resolve(data),
      delete: (id: number) => Promise.resolve()
    },
    invoices: {
      getAll: () => Promise.resolve({ data: [] }),
      create: (data: any) => Promise.resolve(data),
      downloadPDF: (id: number) => Promise.resolve(new Blob())
    },
    payments: {
      getAll: () => Promise.resolve({ data: [] }),
      create: (data: any) => Promise.resolve(data)
    },
    budgets: {
      getAll: () => Promise.resolve({ data: [] }),
      downloadPDF: (id: number) => Promise.resolve(new Blob())
    },
    getHealthCheck: () => Promise.resolve({ status: 'healthy' }),
    getRateLimitInfo: () => ({ limit: 1000, remaining: 999, resetTime: new Date(), requestsThisHour: 1 })
  };

  // setSimpleFACTClient(client);
  return client;
};

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

const SimpleFACTApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'invoices' | 'payments' | 'monitor'>('dashboard');

  useEffect(() => {
    initializeSDK();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              SimpleFact Dashboard
            </h1>
            <HealthIndicator />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'clients', label: 'Clientes' },
              { key: 'invoices', label: 'Facturas' },
              { key: 'payments', label: 'Pagos' },
              { key: 'monitor', label: 'Monitor' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'clients' && <ClientsManager />}
        {activeTab === 'invoices' && <InvoicesManager />}
        {activeTab === 'payments' && <PaymentsManager />}
        {activeTab === 'monitor' && <SystemMonitor />}
      </main>
    </div>
  );
};

// ====================================
// DASHBOARD COMPONENTS
// ====================================

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    // Mock data loading
    const loadData = async () => {
      setLoading(true);
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setClients([]);
      setInvoices([]);
      setPayments([]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = [
    {
      label: 'Total Clientes',
      value: clients?.length || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Facturas Pendientes',
      value: invoices?.filter(inv => inv.status === 'sent').length || 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Pagos Recibidos',
      value: payments?.filter(payment => payment.status === 'completed').length || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Total Facturado',
      value: `€${invoices?.reduce((sum, inv) => sum + inv.total, 0).toFixed(2) || '0.00'}`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${stat.bgColor} rounded-md flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${stat.color}`}>
                      {typeof stat.value === 'string' ? '€' : stat.value.toString().charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.label}
                    </dt>
                    <dd className={`text-lg font-medium ${stat.color}`}>
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentClients clients={clients} />
        <RecentInvoices invoices={invoices} />
      </div>
    </div>
  );
};

// ====================================
// CLIENTS MANAGER
// ====================================

const ClientsManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Mock implementation
      const newClient: Client = {
        ...clientData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setClients(prev => [...prev, newClient]);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  const handleUpdateClient = async (id: number, updates: Partial<Client>) => {
    try {
      setClients(prev => prev.map(client =>
        client.id === id ? { ...client, ...updates, updated_at: new Date().toISOString() } : client
      ));
      setEditingClient(null);
    } catch (err) {
      console.error('Error updating client:', err);
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        setClients(prev => prev.filter(client => client.id !== id));
      } catch (err) {
        console.error('Error deleting client:', err);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Nuevo Cliente
        </button>
      </div>

      {/* Clients List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {clients?.map((client: Client) => (
            <li key={client.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {client.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {client.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {client.address}, {client.city}
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingClient(client)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Forms */}
      {showForm && (
        <ClientForm
          onSubmit={handleCreateClient}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingClient && (
        <ClientForm
          client={editingClient}
          onSubmit={(data: Partial<Client>) => handleUpdateClient(editingClient.id, data)}
          onCancel={() => setEditingClient(null)}
        />
      )}
    </div>
  );
};

// ====================================
// SIMPLE MANAGER COMPONENTS
// ====================================

const InvoicesManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Nueva Factura
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Lista de facturas aparecerá aquí</p>
      </div>
    </div>
  );
};

const PaymentsManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Registrar Pago
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Lista de pagos aparecerá aquí</p>
      </div>
    </div>
  );
};

// ====================================
// UTILITY COMPONENTS
// ====================================

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const HealthIndicator: React.FC = () => {
  const [health, setHealth] = useState<any>({ status: 'healthy' });
  const [rateLimitInfo] = useState({ remaining: 999, limit: 1000 });

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          health?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
        <span className="text-sm text-gray-600">
          API {health?.status || 'unknown'}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        Rate limit: {rateLimitInfo.remaining}/{rateLimitInfo.limit}
      </div>
    </div>
  );
};

const SystemMonitor: React.FC = () => {
  const [health] = useState<any>({ status: 'healthy', timestamp: new Date().toISOString() });
  const rateLimitInfo = { remaining: 999, limit: 1000, resetTime: new Date(), requestsThisHour: 1 };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Monitor del Sistema</h2>

      {/* Health Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estado del Sistema</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado API</dt>
            <dd className={`mt-1 text-sm ${
              health?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
            }`}>
              {health?.status || 'Desconocido'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Última verificación</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
            </dd>
          </div>
        </div>
      </div>

      {/* Rate Limit Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Límites de Uso</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Requests restantes</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {rateLimitInfo.remaining}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Límite total</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {rateLimitInfo.limit}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Reset en</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {rateLimitInfo.resetTime.toLocaleTimeString()}
            </dd>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <div>Uso actual</div>
            <div>{Math.round((rateLimitInfo.requestsThisHour / rateLimitInfo.limit) * 100)}%</div>
          </div>
          <div className="mt-1 relative">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${(rateLimitInfo.requestsThisHour / rateLimitInfo.limit) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock form components
const ClientForm: React.FC<{
  client?: Client;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ client, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    address: client?.address || '',
    city: client?.city || '',
    country: client?.country || 'España',
    status: client?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-medium mb-4">
          {client ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Dirección"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Ciudad"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              {client ? 'Actualizar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecentClients: React.FC<{ clients: Client[] }> = ({ clients }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Clientes Recientes</h3>
    {clients.length === 0 ? (
      <p className="text-gray-500">No hay clientes recientes</p>
    ) : (
      <ul className="space-y-2">
        {clients.slice(0, 5).map(client => (
          <li key={client.id} className="flex justify-between">
            <span>{client.name}</span>
            <span className="text-gray-500">{client.email}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const RecentInvoices: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Facturas Recientes</h3>
    {invoices.length === 0 ? (
      <p className="text-gray-500">No hay facturas recientes</p>
    ) : (
      <ul className="space-y-2">
        {invoices.slice(0, 5).map(invoice => (
          <li key={invoice.id} className="flex justify-between">
            <span>{invoice.invoice_number}</span>
            <span className="text-gray-500">€{invoice.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default SimpleFACTApp;
