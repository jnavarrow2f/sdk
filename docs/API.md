# 📚 SimpleFact SDK - Documentación de API

Esta guía cubre todas las funcionalidades del SDK SimpleFact para JavaScript/TypeScript.

## 📋 Índice

- [🔧 Configuración](#-configuración)
- [👥 Gestión de Clientes](#-gestión-de-clientes)
- [📋 Gestión de Presupuestos](#-gestión-de-presupuestos)
- [🧾 Gestión de Facturas](#-gestión-de-facturas)
- [💰 Gestión de Pagos](#-gestión-de-pagos)
- [👤 Portal de Clientes](#-portal-de-clientes)
- [🔍 Verificación Pública](#-verificación-pública)
- [📄 Descarga de Documentos](#-descarga-de-documentos)
- [⚠️ Manejo de Errores](#️-manejo-de-errores)

## 🔧 Configuración

### Crear cliente SDK

```typescript
import { SimpleFACTClient } from 'simplefact-sdk';

const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',     // URL base de la API
  apiToken: 'tu_token_jwt',                  // Token de autenticación
  timeout: 30000,                            // Timeout en ms (default: 30000)
  debug: false,                              // Habilitar logs debug
  autoRefreshToken: true,                    // Auto-renovar token
  rateLimitPerHour: 1000                     // Límite de requests por hora
});
```

### Obtener token de API

```typescript
const response = await fetch('https://app.simplefact.com/api/auth/api-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@empresa.com',
    password: 'contraseña'
  })
});

const { data } = await response.json();
const token = data.token;
```

## 👥 Gestión de Clientes

### Listar clientes

```typescript
const response = await client.clients.getAll({
  page: 1,                    // Página (default: 1)
  limit: 10,                  // Límite por página (max: 100)
  search: 'empresa',          // Buscar por nombre o email
  status: 'active',           // Filtrar por estado
  sort_by: 'name',           // Ordenar por campo
  sort_direction: 'asc'       // Dirección de orden
});

console.log('Clientes:', response.data);
console.log('Paginación:', response.meta);
```

### Obtener cliente por ID

```typescript
const response = await client.clients.getById(123);
console.log('Cliente:', response.data);
```

### Crear cliente

```typescript
const clientData = {
  name: 'Nueva Empresa SL',
  email: 'contacto@nuevaempresa.com',
  phone: '+34 900 123 456',
  address: 'Calle Principal 123',
  city: 'Madrid',
  postal_code: '28001',
  country: 'España',
  tax_id: 'B12345678'
};

const response = await client.clients.create(clientData);
console.log('Cliente creado:', response.data);
```

### Actualizar cliente

```typescript
const updates = {
  name: 'Empresa Actualizada SL',
  phone: '+34 900 999 888'
};

const response = await client.clients.update(123, updates);
console.log('Cliente actualizado:', response.data);
```

### Eliminar cliente

```typescript
await client.clients.delete(123);
console.log('Cliente eliminado');
```

## 📋 Gestión de Presupuestos

### Listar presupuestos

```typescript
const response = await client.budgets.getAll({
  status: 'pending',          // pending, approved, rejected, expired, invoiced
  client_id: 123,            // Filtrar por cliente
  year: 2024,                // Filtrar por año
  month: 1,                  // Filtrar por mes
  limit: 20
});

console.log('Presupuestos:', response.data);
```

### Crear presupuesto

```typescript
const budgetData = {
  client_id: 123,
  issue_date: '2024-01-15',
  expiry_date: '2024-02-15',
  items: [
    {
      description: 'Desarrollo web',
      quantity: 1,
      unit_price: 2500.00,
      tax_rate: 21.00
    },
    {
      description: 'Mantenimiento anual',
      quantity: 12,
      unit_price: 150.00,
      tax_rate: 21.00
    }
  ],
  notes: 'Presupuesto válido por 30 días'
};

const response = await client.budgets.create(budgetData);
console.log('Presupuesto creado:', response.data);
```

### Aprobar presupuesto

```typescript
const response = await client.budgets.approve(456);
console.log('Presupuesto aprobado:', response.data);
```

### Convertir presupuesto a factura

```typescript
const response = await client.budgets.convertToInvoice(456);
console.log('Factura creada:', response.data);
```

## 🧾 Gestión de Facturas

### Listar facturas

```typescript
const response = await client.invoices.getAll({
  status: 'sent',             // draft, sent, viewed, paid, overdue, cancelled
  payment_status: 'pending',  // pending, partial, paid, overdue
  client_id: 123,
  year: 2024,
  month: 1,
  limit: 20
});

console.log('Facturas:', response.data);
```

### Crear factura

```typescript
const invoiceData = {
  client_id: 123,
  budget_id: 456,            // Opcional, si viene de presupuesto
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  items: [
    {
      description: 'Consultoría IT',
      quantity: 10,
      unit_price: 75.00,
      tax_rate: 21.00
    }
  ],
  notes: 'Pago a 30 días',
  payment_terms: 'Transferencia bancaria'
};

const response = await client.invoices.create(invoiceData);
console.log('Factura creada:', response.data);
```

### Actualizar estado de factura

```typescript
const response = await client.invoices.updateStatus(789, {
  status: 'sent',
  notes: 'Factura enviada por email'
});

console.log('Estado actualizado:', response.data);
```

### Obtener estadísticas de facturas

```typescript
const stats = await client.invoices.getStatistics();
console.log('Estadísticas:', stats);
// {
//   totalInvoices: 156,
//   totalAmount: 45230.50,
//   paidAmount: 32150.00,
//   pendingAmount: 13080.50,
//   overdueAmount: 0.00,
//   averageAmount: 290.07
// }
```

## 💰 Gestión de Pagos

### Listar pagos de una factura

```typescript
const response = await client.payments.listByInvoice(789);
console.log('Pagos:', response.payments);
console.log('Info factura:', response.invoice);
```

### Registrar pago

```typescript
const paymentData = {
  invoice_id: 789,
  amount: 500.00,
  payment_date: '2024-01-20',
  payment_method: 'bank_transfer',  // bank_transfer, cash, credit_card, check, other
  reference: 'TRF-2024-001',
  notes: 'Pago parcial por transferencia'
};

const response = await client.payments.create(paymentData);
console.log('Pago registrado:', response.data);
```

### Pagar factura completa

```typescript
const response = await client.payments.payInFull(
  789,                        // ID de factura
  'bank_transfer',           // Método de pago
  'TRF-FULL-001',           // Referencia
  'Pago completo'           // Notas
);

console.log('Factura pagada:', response.data);
```

### Estadísticas de pagos

```typescript
const stats = await client.payments.getInvoicePaymentStats(789);
console.log('Estadísticas de pagos:', stats);
// {
//   totalPaid: 1500.00,
//   remainingAmount: 420.00,
//   paymentCount: 3,
//   lastPaymentDate: '2024-01-20',
//   paymentMethods: [
//     { method: 'bank_transfer', count: 2, amount: 1200.00 },
//     { method: 'cash', count: 1, amount: 300.00 }
//   ]
// }
```

## 👤 Portal de Clientes

### Obtener perfil de cliente

```typescript
// Usar token de cliente (no de administrador)
const client = new SimpleFACTClient({
  baseURL: 'https://app.simplefact.com',
  apiToken: 'token_del_cliente'
});

const profile = await client.clientPortal.getProfile();
console.log('Perfil:', profile);
```

### Actualizar perfil de cliente

```typescript
const updates = {
  name: 'Empresa Actualizada SL',
  phone: '+34 900 999 888',
  address: 'Nueva dirección 456'
};

await client.clientPortal.updateProfile(updates);
console.log('Perfil actualizado');
```

### Obtener facturas del cliente

```typescript
const response = await client.clientPortal.getInvoices({
  status: 'pending',
  year: 2024,
  limit: 10
});

console.log('Facturas:', response.invoices);
console.log('Estadísticas:', response.statistics);
```

### Obtener presupuestos del cliente

```typescript
const response = await client.clientPortal.getBudgets({
  status: 'pending'
});

console.log('Presupuestos:', response.budgets);
console.log('Estadísticas:', response.statistics);
```

### Cambiar contraseña

```typescript
const passwordData = {
  current_password: 'contraseña_actual',
  new_password: 'nueva_contraseña_segura',
  confirm_password: 'nueva_contraseña_segura'
};

await client.clientPortal.changePassword(passwordData);
console.log('Contraseña cambiada');
```

## 🔍 Verificación Pública

### Verificar factura por código QR

```typescript
// Sin autenticación - endpoint público
const response = await fetch('https://app.simplefact.com/api/v1/verify/abc123hash');
const result = await response.json();

if (result.success && result.data.valid) {
  console.log('Factura válida:', result.data.invoice);
  console.log('Empresa:', result.data.company);
  console.log('Cliente:', result.data.client);
} else {
  console.log('Factura no válida');
}
```

### Verificación con validación de datos

```typescript
const validationData = {
  invoice_number: 'F-2024-0123',
  total: 1210.00,
  client_tax_id: 'B87654321',
  date: '2024-01-15'
};

const response = await fetch('https://app.simplefact.com/api/v1/verify/abc123hash', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(validationData)
});

const result = await response.json();

if (result.data.verified && result.data.validation_errors.length === 0) {
  console.log('Factura verificada correctamente');
} else {
  console.log('Errores de validación:', result.data.validation_errors);
}
```

## 📄 Descarga de Documentos

### Descargar PDF de factura

```typescript
const pdfBlob = await client.invoices.downloadPDF(789);

// Crear enlace de descarga
const url = URL.createObjectURL(pdfBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'factura-F-2024-0123.pdf';
a.click();
URL.revokeObjectURL(url);
```

### Descargar XML de factura

```typescript
const xmlBlob = await client.invoices.downloadXML(789);

// Guardar archivo XML (formato FacturaE)
const url = URL.createObjectURL(xmlBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'factura-F-2024-0123.xml';
a.click();
URL.revokeObjectURL(url);
```

### Descargar PDF de presupuesto

```typescript
const pdfBlob = await client.budgets.downloadPDF(456);
// Similar proceso de descarga
```

## ⚠️ Manejo de Errores

### Tipos de errores

```typescript
import { SimpleFACTError, ErrorCodes } from 'simplefact-sdk';

try {
  const invoice = await client.invoices.create(invoiceData);
} catch (error) {
  if (error instanceof SimpleFACTError) {
    console.log('Código de error:', error.code);
    console.log('Mensaje:', error.message);
    console.log('Status HTTP:', error.statusCode);
    console.log('Detalles:', error.details);

    switch (error.code) {
      case ErrorCodes.UNAUTHORIZED:
        console.log('Token inválido o expirado');
        break;
      case ErrorCodes.VALIDATION_ERROR:
        console.log('Error de validación:', error.details);
        break;
      case ErrorCodes.RATE_LIMIT_EXCEEDED:
        console.log('Límite de requests excedido');
        break;
      case ErrorCodes.INVOICE_NOT_FOUND:
        console.log('Factura no encontrada');
        break;
      default:
        console.log('Error no manejado:', error.message);
    }
  }
}
```

### Códigos de error más comunes

| Código | Descripción |
|--------|-------------|
| `UNAUTHORIZED` | Token requerido o inválido |
| `VALIDATION_ERROR` | Datos de entrada inválidos |
| `CLIENT_NOT_FOUND` | Cliente no encontrado |
| `INVOICE_NOT_FOUND` | Factura no encontrada |
| `PAYMENT_EXCEEDS_REMAINING` | Pago excede cantidad pendiente |
| `RATE_LIMIT_EXCEEDED` | Límite de requests excedido |
| `BUDGET_ALREADY_INVOICED` | Presupuesto ya facturado |

### Manejo de rate limiting

```typescript
// Verificar límites antes de hacer requests
const rateLimitInfo = client.getRateLimitInfo();

if (rateLimitInfo.remaining < 10) {
  console.warn('Pocas requests restantes:', rateLimitInfo.remaining);
  console.log('Reset en:', rateLimitInfo.resetTime);
}

// El SDK maneja automáticamente el rate limiting
// y arroja SimpleFACTError con código RATE_LIMIT_EXCEEDED
```

### Health check del sistema

```typescript
const health = await client.getHealthCheck();

if (health.status === 'healthy') {
  console.log('Sistema operativo');
} else {
  console.warn('Sistema con problemas');
}

console.log('Servicios:', health.services);
```

---

## 🔗 Recursos adicionales

- 📖 **[README principal](../README.md)** - Guía de inicio rápido
- ⚛️ **[Hooks de React](./HOOKS.md)** - Uso con React
- 💡 **[Ejemplos](./EXAMPLES.md)** - Casos de uso prácticos
- 🌐 **[API Explorer](https://app.simplefact.com/swagger)** - Swagger UI

---

**📚 SimpleFact SDK API** - Documentación completa para desarrolladores
