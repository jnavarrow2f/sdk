# SimpleFact SDK - Ejemplos Prácticos

Esta carpeta contiene ejemplos completos de cómo usar el SimpleFact SDK en diferentes entornos y tecnologías.

## 📋 Índice

- [🔧 Configuración Inicial](#-configuración-inicial)
- [⚛️ Ejemplo React](#️-ejemplo-react)
- [🖥️ Ejemplo Node.js](#️-ejemplo-nodejs)
- [🔍 Testing](#-testing)
- [🚀 Despliegue](#-despliegue)
- [❓ FAQ](#-faq)

## 🔧 Configuración Inicial

### Instalación del SDK

```bash
npm install simplefact-sdk
# o
yarn add simplefact-sdk
# o
bun add simplefact-sdk
```

### Variables de Entorno

Crea un archivo `.env` en tu proyecto:

```env
# Configuración SimpleFact
SIMPLEFACT_API_URL=https://app.simplefact.com
SIMPLEFACT_API_TOKEN=tu_token_jwt_aqui
SIMPLEFACT_EMAIL=usuario@empresa.com
SIMPLEFACT_PASSWORD=tu_password_seguro

# Para React (prefijo REACT_APP)
REACT_APP_SIMPLEFACT_API_URL=https://app.simplefact.com
REACT_APP_SIMPLEFACT_TOKEN=tu_token_jwt_aqui
REACT_APP_SIMPLEFACT_EMAIL=usuario@empresa.com
REACT_APP_SIMPLEFACT_PASSWORD=tu_password_seguro

# Para Node.js
NODE_ENV=development
PORT=3001
```

## ⚛️ Ejemplo React

### Archivo: `react-example.tsx`

Una aplicación React completa que demuestra:

- ✅ **Configuración del SDK** con hooks personalizados
- ✅ **Gestión de clientes** con CRUD completo
- ✅ **Listado de facturas** con filtros y paginación
- ✅ **Gestión de pagos** en tiempo real
- ✅ **Monitoreo del sistema** con health checks y rate limiting
- ✅ **Manejo de errores** robusto
- ✅ **Optimistic updates** para mejor UX

### Características principales:

#### 🎯 Hooks Especializados
```typescript
// Hook para gestión de clientes
const {
  data: clients,
  loading,
  error,
  create,
  update,
  remove,
  pagination
} = useClients({ search: 'empresa', limit: 10 });

// Hook para facturas
const { data: invoices } = useInvoices({
  status: 'sent',
  client_id: 1
});

// Hook para monitoreo
const rateLimitInfo = useRateLimit();
const { data: isHealthy } = useHealthCheck(30000);
```

#### 🔄 Operaciones CRUD Simplificadas
```typescript
// Crear cliente
await create({
  name: 'Empresa Ejemplo S.L.',
  email: 'cliente@empresa.com',
  address: 'Calle Principal 123',
  city: 'Madrid',
  country: 'España'
});

// Actualizar cliente con optimistic updates
await update(clientId, { phone: '+34 666 777 888' });

// Eliminar con confirmación
if (confirm('¿Eliminar cliente?')) {
  await remove(clientId);
}
```

### Ejecutar el ejemplo React:

```bash
# 1. Instalar dependencias
npm install react react-dom @types/react @types/react-dom

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Ejecutar con Vite o Create React App
npm run dev
```

## 🖥️ Ejemplo Node.js

### Archivo: `node-example.js`

Una API REST completa con Express.js que incluye:

- ✅ **API REST completa** con todos los endpoints
- ✅ **Manejo de errores** centralizado del SDK
- ✅ **Validación de datos** robusta
- ✅ **Procesamiento masivo** de facturas
- ✅ **Sincronización de datos** automática
- ✅ **Health checks** y monitoreo
- ✅ **Descarga de PDFs** optimizada

### Endpoints disponibles:

#### 🔍 Monitoreo y Salud
```http
GET /health
GET /api/rate-limit
```

#### 👥 Gestión de Clientes
```http
GET    /api/clients
GET    /api/clients/:id
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id
GET    /api/clients/search/:query
```

#### 📄 Gestión de Facturas
```http
GET  /api/invoices
GET  /api/invoices/:id
POST /api/invoices
GET  /api/invoices/:id/pdf
GET  /api/invoices/stats
```

#### 💰 Gestión de Pagos
```http
GET  /api/payments
POST /api/invoices/:id/payments
```

#### 🔍 Verificación Pública
```http
GET /api/verify/:hash
```

#### 🛠️ Utilidades
```http
POST /api/bulk/invoices
POST /api/sync
```

### Ejemplos de uso:

#### Crear cliente
```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa Ejemplo S.L.",
    "email": "cliente@empresa.com",
    "address": "Calle Principal 123",
    "city": "Madrid",
    "country": "España",
    "tax_id": "B12345678"
  }'
```

#### Crear factura
```bash
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "issue_date": "2024-01-15",
    "due_date": "2024-02-15",
    "items": [
      {
        "description": "Servicio de consultoría",
        "quantity": 2,
        "unit_price": 50.00,
        "tax_rate": 21.00
      }
    ]
  }'
```

#### Registrar pago
```bash
curl -X POST http://localhost:3001/api/invoices/1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 121.00,
    "payment_date": "2024-01-20",
    "payment_method": "bank_transfer",
    "reference": "TRANS-123456"
  }'
```

### Ejecutar el ejemplo Node.js:

```bash
# 1. Instalar dependencias
npm install express cors dotenv simplefact-sdk

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Ejecutar servidor
node node-example.js

# El servidor estará disponible en http://localhost:3001
```

## 🔍 Testing

### Testing del SDK

```javascript
// test-sdk.js
const { SimpleFACTClient } = require('simplefact-sdk');

async function testSDK() {
  const client = new SimpleFACTClient({
    baseURL: 'https://app.simplefact.com',
    apiToken: process.env.SIMPLEFACT_API_TOKEN,
    debug: true
  });

  try {
    // Test health check
    console.log('Testing health check...');
    const isHealthy = await client.healthCheck();
    console.log('API Health:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');

    // Test rate limit info
    const rateLimitInfo = client.getRateLimitInfo();
    console.log('Rate Limit:', rateLimitInfo);

    // Test clients list
    console.log('Testing clients list...');
    const clientsResponse = await client.clients.getAll({ limit: 5 });
    console.log('Clients found:', clientsResponse.data?.length || 0);

    // Test invoices list
    console.log('Testing invoices list...');
    const invoicesResponse = await client.invoices.getAll({ limit: 5 });
    console.log('Invoices found:', invoicesResponse.data?.length || 0);

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSDK();
```

### Testing con Jest

```javascript
// __tests__/sdk.test.js
import { SimpleFACTClient, SimpleFACTError } from '@simplefact/sdk';

describe('SimpleFact SDK', () => {
  let client;

  beforeAll(() => {
    client = new SimpleFACTClient({
      baseURL: process.env.SIMPLEFACT_API_URL,
      apiToken: process.env.SIMPLEFACT_API_TOKEN
    });
  });

  test('should connect to API', async () => {
    const isHealthy = await client.healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('should fetch clients', async () => {
    const response = await client.clients.getAll({ limit: 5 });
    expect(response.data).toBeInstanceOf(Array);
  });

  test('should handle errors gracefully', async () => {
    try {
      await client.clients.getById(999999);
    } catch (error) {
      expect(error).toBeInstanceOf(SimpleFACTError);
      expect(error.code).toBe('NOT_FOUND_ERROR');
    }
  });
});
```

## 🚀 Despliegue

### Docker para Node.js

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3001

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "node-example.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  simplefact-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - SIMPLEFACT_API_URL=https://app.simplefact.com
      - SIMPLEFACT_API_TOKEN=${SIMPLEFACT_API_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Vercel para React

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "build/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/build/$1"
    }
  ],
  "env": {
    "REACT_APP_SIMPLEFACT_API_URL": "@simplefact-api-url",
    "REACT_APP_SIMPLEFACT_TOKEN": "@simplefact-token"
  }
}
```

### Heroku

```json
// package.json
{
  "scripts": {
    "start": "node node-example.js",
    "dev": "nodemon node-example.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

```
# Procfile
web: node node-example.js
```

## ❓ FAQ

### ¿Cómo manejo los errores del SDK?

```javascript
import { SimpleFACTError, ErrorCodes } from '@simplefact/sdk';

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
        break;
      default:
        console.log('Error desconocido:', error.message);
    }
  }
}
```

### ¿Cómo optimizo el rendimiento?

```javascript
// 1. Configurar retry y timeout adecuados
const client = new SimpleFACTClient({
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});

// 2. Usar paginación apropiada
const response = await client.invoices.getAll({
  limit: 50, // No más de 100
  page: 1
});

// 3. Monitorear rate limits
const rateLimitInfo = client.getRateLimitInfo();
if (rateLimitInfo.remaining < 10) {
  // Esperar o reducir frecuencia de requests
}
```

### ¿Cómo uso el SDK en producción?

```javascript
// Configuración de producción
const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',
  apiToken: process.env.SIMPLEFACT_API_TOKEN,
  autoRefreshToken: true,
  retryAttempts: 3,
  debug: false, // Desactivar en producción
  timeout: 30000
});

// Manejo de errores robusto
const handleOperation = async (operation) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;

      if (error.code === 'RATE_LIMIT_EXCEEDED' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
};
```

### ¿Cómo integro con bases de datos?

```javascript
// Ejemplo con MongoDB/Mongoose
const syncWithDatabase = async () => {
  try {
    // Obtener datos de SimpleFact
    const response = await client.clients.getAll({ limit: 1000 });
    const simplefactClients = response.data;

    // Sincronizar con base de datos local
    for (const sfClient of simplefactClients) {
      await LocalClient.findOneAndUpdate(
        { simplefact_id: sfClient.id },
        {
          name: sfClient.name,
          email: sfClient.email,
          last_sync: new Date()
        },
        { upsert: true }
      );
    }

    console.log('Sincronización completada');
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
};
```

## 📞 Soporte

Si tienes problemas con los ejemplos:

1. **Verifica la configuración** de variables de entorno
2. **Consulta la documentación** del SDK principal
3. **Revisa los logs** en modo debug
4. **Contacta soporte** en support@simplefact.com

---

**📝 Nota:** Estos ejemplos están diseñados para ser puntos de partida. Adapta el código según las necesidades específicas de tu aplicación.
