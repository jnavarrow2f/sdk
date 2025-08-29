# SimpleFact SDK para JavaScript/TypeScript

[![npm version](https://badge.fury.io/js/simplefact-sdk.svg)](https://badge.fury.io/js/simplefact-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

SDK oficial de JavaScript/TypeScript para la API REST de SimpleFact SaaS. Simplifica la integración con el sistema de facturación electrónica líder para empresas españolas.

## 🚀 Características Principales

- ✅ **TypeScript completo** con tipado estricto
- ✅ **Hooks React** pre-configurados para uso en frontend
- ✅ **Manejo automático de errores** con retry inteligente
- ✅ **Renovación automática de tokens** JWT
- ✅ **Rate limiting** inteligente con backoff
- ✅ **Interceptores personalizables**
- ✅ **Cache automático** en hooks React
- ✅ **SSR compatible** con Next.js

## 📦 Instalación

```bash
# npm
npm install simplefact-sdk

# yarn
yarn add simplefact-sdk

# bun
bun add simplefact-sdk
```

## 🔧 Configuración Básica

### Uso en Node.js / Backend

```typescript
import { SimpleFACTClient } from 'simplefact-sdk';

const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',
  apiToken: process.env.SIMPLEFACT_API_TOKEN,
  timeout: 30000,
  debug: process.env.NODE_ENV === 'development'
});

// Generar token si no tienes uno
const token = await client.generateToken({
  email: 'usuario@empresa.com',
  password: 'tu_password'
});
```

### Uso en React / Frontend

```typescript
import { SimpleFACTClient, setSimpleFACTClient } from 'simplefact-sdk';

// Configurar cliente global
const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',
  apiToken: 'tu_token_jwt',
  autoRefreshToken: true,
  email: 'usuario@empresa.com',
  password: 'tu_password'
});

setSimpleFACTClient(client);
```

## 📚 Ejemplos de Uso

### Gestión de Clientes

```typescript
// Listar todos los clientes
const clients = await client.clients.getAll({
  page: 1,
  limit: 10,
  search: 'empresa'
});

// Crear nuevo cliente
const newClient = await client.clients.create({
  name: 'Empresa Ejemplo S.L.',
  email: 'cliente@empresa.com',
  address: 'Calle Principal 123',
  city: 'Madrid',
  country: 'España',
  tax_id: 'B12345678'
});

// Actualizar cliente
const updatedClient = await client.clients.update(1, {
  phone: '+34 600 123 456'
});

// Obtener cliente específico
const client = await client.clients.getById(1);
```

### Gestión de Facturas

```typescript
// Crear nueva factura
const invoice = await client.invoices.create({
  client_id: 1,
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  items: [
    {
      description: 'Servicio de consultoría',
      quantity: 2,
      unit_price: 50.00,
      tax_rate: 21.00
    },
    {
      description: 'Soporte técnico',
      quantity: 10,
      unit_price: 25.00,
      tax_rate: 21.00
    }
  ],
  notes: 'Factura de ejemplo'
});

// Listar facturas con filtros
const invoices = await client.invoices.getAll({
  status: 'sent',
  client_id: 1,
  date_from: '2024-01-01',
  date_to: '2024-12-31'
});

// Descargar PDF de factura
const pdfBlob = await client.invoices.downloadPDF(invoice.id);

// Descargar XML de factura
const xmlBlob = await client.invoices.downloadXML(invoice.id);
```

### Gestión de Pagos

```typescript
// Registrar pago
const payment = await client.payments.create(invoice.id, {
  amount: 121.00,
  payment_date: '2024-01-20',
  payment_method: 'bank_transfer',
  reference: 'TRANS-123456',
  notes: 'Pago completo'
});

// Listar pagos de una factura
const payments = await client.payments.getAll({
  invoice_id: invoice.id
});
```

### Verificación Pública de Documentos

```typescript
// Verificar documento sin autenticación
const verification = await client.verification.verify('hash_documento_publico');

if (verification.verified) {
  console.log('Documento verificado:', verification.document);
} else {
  console.log('Error de verificación:', verification.error);
}
```

## ⚛️ Hooks React

### Hook de Clientes

```typescript
import { useClients } from 'simplefact-sdk/hooks';

function ClientsPage() {
  const {
    data: clients,
    loading,
    error,
    create,
    update,
    remove,
    refresh,
    pagination
  } = useClients({
    search: 'empresa',
    limit: 10
  });

  const handleCreateClient = async () => {
    await create({
      name: 'Nueva Empresa',
      email: 'nueva@empresa.com',
      address: 'Dirección nueva',
      city: 'Madrid',
      country: 'España'
    });
  };

  if (loading) return <div>Cargando clientes...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCreateClient}>
        Crear Cliente
      </button>

      {clients.map(client => (
        <div key={client.id}>
          <h3>{client.name}</h3>
          <p>{client.email}</p>
          <button onClick={() => update(client.id!, { phone: '+34 666 777 888' })}>
            Actualizar
          </button>
          <button onClick={() => remove(client.id!)}>
            Eliminar
          </button>
        </div>
      ))}

      <div>
        Página {pagination?.page} de {pagination?.totalPages}
      </div>
    </div>
  );
}
```

### Hook de Facturas

```typescript
import { useInvoices, useInvoice } from 'simplefact-sdk/hooks';

function InvoicesPage() {
  const {
    data: invoices,
    loading,
    error,
    create,
    filters,
    setFilters
  } = useInvoices({
    status: 'sent',
    limit: 20
  });

  const handleCreateInvoice = async () => {
    await create({
      client_id: 1,
      issue_date: '2024-01-15',
      due_date: '2024-02-15',
      items: [
        {
          description: 'Servicio',
          quantity: 1,
          unit_price: 100.00,
          tax_rate: 21.00
        }
      ]
    });
  };

  return (
    <div>
      <div>
        <select onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviada</option>
          <option value="paid">Pagada</option>
        </select>
      </div>

      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
}

function InvoiceDetail({ id }: { id: number }) {
  const { data: invoice, loading, error } = useInvoice(id);

  if (loading) return <div>Cargando factura...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!invoice) return <div>Factura no encontrada</div>;

  return (
    <div>
      <h1>Factura {invoice.number}</h1>
      <p>Cliente: {invoice.client?.name}</p>
      <p>Total: {invoice.total}€</p>
      <p>Estado: {invoice.status}</p>
    </div>
  );
}
```

### Hook de Descargas

```typescript
import { useDownload } from 'simplefact-sdk/hooks';

function DownloadButton({ type, id }: { type: 'invoice' | 'budget'; id: number }) {
  const { download, loading, error } = useDownload();

  const handleDownloadPDF = async () => {
    try {
      const blob = await download(type, id, 'pdf');

      // Crear URL de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error descargando PDF:', err);
    }
  };

  return (
    <button onClick={handleDownloadPDF} disabled={loading}>
      {loading ? 'Descargando...' : 'Descargar PDF'}
    </button>
  );
}
```

## 🛠️ Configuración Avanzada

### Interceptores Personalizados

```typescript
const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',
  apiToken: 'tu_token'
});

// Acceder al cliente HTTP interno para interceptores personalizados
const httpClient = client.getHttpClient();

// Interceptor de request
httpClient.interceptors.request.use(
  (config) => {
    console.log('Enviando request:', config.method, config.url);
    return config;
  }
);

// Interceptor de response
httpClient.interceptors.response.use(
  (response) => {
    console.log('Response recibido:', response.status);
    return response;
  }
);
```

### Manejo de Errores

```typescript
import { SimpleFACTError, ErrorCodes } from 'simplefact-sdk';

try {
  await client.clients.create(invalidData);
} catch (error) {
  if (error instanceof SimpleFACTError) {
    switch (error.code) {
      case ErrorCodes.VALIDATION_ERROR:
        console.log('Error de validación:', error.details);
        break;
      case ErrorCodes.RATE_LIMIT_EXCEEDED:
        console.log('Rate limit excedido, reintentando en:', error.details.resetTime);
        break;
      case ErrorCodes.AUTHENTICATION_ERROR:
        console.log('Token inválido, renovando...');
        await client.refreshToken();
        break;
      default:
        console.log('Error desconocido:', error.message);
    }
  }
}
```

### Rate Limiting

```typescript
import { useRateLimit } from 'simplefact-sdk/hooks';

function RateLimitIndicator() {
  const rateLimitInfo = useRateLimit();

  return (
    <div>
      <p>Requests restantes: {rateLimitInfo.remaining}/{rateLimitInfo.limit}</p>
      <p>Reset en: {rateLimitInfo.resetTime.toLocaleString()}</p>
      <div style={{
        width: '100%',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px'
      }}>
        <div style={{
          width: `${(rateLimitInfo.remaining / rateLimitInfo.limit) * 100}%`,
          height: '8px',
          backgroundColor: rateLimitInfo.remaining > 100 ? '#4CAF50' : '#FF9800',
          borderRadius: '4px'
        }} />
      </div>
    </div>
  );
}
```

## 🔄 Mutaciones con Optimistic Updates

```typescript
import { useClients } from 'simplefact-sdk/hooks';

function OptimisticClientUpdate() {
  const { data: clients, update, mutate } = useClients();

  const handleOptimisticUpdate = async (clientId: number, newName: string) => {
    // Actualización optimista
    const oldData = clients;
    const optimisticData = clients.map(client =>
      client.id === clientId ? { ...client, name: newName } : client
    );
    mutate(optimisticData);

    try {
      // Actualización real
      await update(clientId, { name: newName });
    } catch (error) {
      // Revertir en caso de error
      mutate(oldData);
      throw error;
    }
  };

  return (
    <div>
      {/* UI components */}
    </div>
  );
}
```

## 📊 Monitoreo y Debugging

### Health Check

```typescript
import { useHealthCheck } from 'simplefact-sdk/hooks';

function SystemStatus() {
  const { data: isHealthy, loading, error } = useHealthCheck(30000); // Check every 30s

  return (
    <div>
      <div style={{
        color: isHealthy ? 'green' : 'red',
        fontWeight: 'bold'
      }}>
        API Status: {loading ? 'Checking...' : isHealthy ? 'Healthy' : 'Down'}
      </div>
    </div>
  );
}
```

### Debug Mode

```typescript
const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',
  apiToken: 'tu_token',
  debug: true // Habilita logging detallado
});

// Los logs aparecerán en consola:
// [SimpleFact SDK] GET /api/v1/clients
// [SimpleFact SDK] Response 200: { success: true, data: [...] }
```

## 🔐 Seguridad y Best Practices

### Variables de Entorno

```typescript
// .env.local
SIMPLEFACT_API_TOKEN=tu_token_jwt_aqui
SIMPLEFACT_EMAIL=usuario@empresa.com
SIMPLEFACT_PASSWORD=tu_password_seguro

// En tu código
const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',
  apiToken: process.env.SIMPLEFACT_API_TOKEN,
  email: process.env.SIMPLEFACT_EMAIL,
  password: process.env.SIMPLEFACT_PASSWORD,
  autoRefreshToken: true
});
```

### Renovación Automática de Tokens

```typescript
const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',
  email: 'usuario@empresa.com',
  password: 'tu_password',
  autoRefreshToken: true, // El SDK renovará automáticamente tokens expirados
  retryAttempts: 3,
  retryDelay: 1000
});
```

## 📖 Tipos TypeScript

El SDK incluye tipos TypeScript completos para todas las entidades:

```typescript
import type {
  Client,
  Invoice,
  Budget,
  Payment,
  InvoiceStatus,
  PaymentMethod,
  SimpleFACTError,
  ApiResponse
} from '@simplefact/sdk';

// Todos los tipos están disponibles para auto-completado y validación
```

## 🌐 Compatibilidad

- **Node.js**: >=14.0.0
- **Browsers**: Modernos con soporte ES2020
- **React**: >=16.8.0 (para hooks)
- **Next.js**: >=12.0.0 (SSR compatible)
- **TypeScript**: >=4.5.0

## 📝 Ejemplos Completos

Consulta la carpeta `/examples` para ejemplos completos de:

- Aplicación React con hooks
- API Node.js con Express
- Next.js con SSR
- Gestión de errores avanzada
- Testing con Jest

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Añade tests si es necesario
4. Asegúrate de que todos los tests pasen
5. Crea un Pull Request

## 📄 Licencia

MIT © [SimpleFact Team](https://simplefact.com)

## 🔗 Enlaces

- [Documentación API](https://docs.simplefact.com)
- [Swagger UI](https://app.simplefact.com/docs)
- [Repositorio GitHub](https://github.com/simplefact/sdk)
- [NPM Package](https://www.npmjs.com/package/simplefact-sdk)
- [Soporte](mailto:support@simplefact.com)

---

**SimpleFact SDK v1.0.0** - Integración simple y poderosa para tu sistema de facturación 🚀
