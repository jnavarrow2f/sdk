// ====================================
// EJEMPLO PRÁCTICO - NODE.JS + SIMPLEFACT SDK
// API Backend completa con Express.js
// ====================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { SimpleFACTClient, SimpleFACTError, ErrorCodes } = require('@simplefact/sdk');

// Cargar variables de entorno
dotenv.config();

// ====================================
// CONFIGURACIÓN DEL SDK
// ====================================

const simpleFACT = new SimpleFACTClient({
  baseURL: process.env.SIMPLEFACT_API_URL || 'https://app.simplefact.com',
  apiToken: process.env.SIMPLEFACT_API_TOKEN,
  email: process.env.SIMPLEFACT_EMAIL,
  password: process.env.SIMPLEFACT_PASSWORD,
  autoRefreshToken: true,
  retryAttempts: 3,
  debug: process.env.NODE_ENV === 'development',
  timeout: 30000
});

// ====================================
// CONFIGURACIÓN DE EXPRESS
// ====================================

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware de manejo de errores del SDK
const handleSDKError = (error, res) => {
  console.error('SDK Error:', error);

  if (error instanceof SimpleFACTError) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR'
  });
};

// ====================================
// RUTAS DE SALUD Y MONITOREO
// ====================================

// Health check
app.get('/health', async (req, res) => {
  try {
    const isHealthy = await simpleFACT.healthCheck();
    const rateLimitInfo = simpleFACT.getRateLimitInfo();

    res.json({
      success: true,
      data: {
        server: 'healthy',
        api: isHealthy ? 'connected' : 'disconnected',
        rateLimit: rateLimitInfo,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Rate limit info
app.get('/api/rate-limit', (req, res) => {
  try {
    const rateLimitInfo = simpleFACT.getRateLimitInfo();
    res.json({
      success: true,
      data: rateLimitInfo
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// ====================================
// API DE CLIENTES
// ====================================

// Listar clientes
app.get('/api/clients', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const response = await simpleFACT.clients.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status
    });

    res.json({
      success: true,
      data: response.data,
      meta: response.meta
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Obtener cliente específico
app.get('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await simpleFACT.clients.getById(parseInt(id));

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Crear nuevo cliente
app.post('/api/clients', async (req, res) => {
  try {
    const clientData = req.body;

    // Validación básica
    if (!clientData.name || !clientData.email || !clientData.address || !clientData.city || !clientData.country) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: name, email, address, city, country',
        code: 'VALIDATION_ERROR'
      });
    }

    const client = await simpleFACT.clients.create(clientData);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Actualizar cliente
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const client = await simpleFACT.clients.update(parseInt(id), updates);

    res.json({
      success: true,
      data: client,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Eliminar cliente
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await simpleFACT.clients.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Buscar clientes
app.get('/api/clients/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const clients = await simpleFACT.clients.search(query, parseInt(limit));

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// ====================================
// API DE FACTURAS
// ====================================

// Listar facturas
app.get('/api/invoices', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      client_id,
      date_from,
      date_to,
      search
    } = req.query;

    const response = await simpleFACT.invoices.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      client_id: client_id ? parseInt(client_id) : undefined,
      date_from,
      date_to,
      search
    });

    res.json({
      success: true,
      data: response.data,
      meta: response.meta
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Obtener factura específica
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await simpleFACT.invoices.getById(parseInt(id));

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Crear nueva factura
app.post('/api/invoices', async (req, res) => {
  try {
    const invoiceData = req.body;

    // Validación básica
    if (!invoiceData.client_id || !invoiceData.items || !Array.isArray(invoiceData.items)) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: client_id, items (array)',
        code: 'VALIDATION_ERROR'
      });
    }

    // Establecer fechas por defecto si no se proporcionan
    if (!invoiceData.issue_date) {
      invoiceData.issue_date = new Date().toISOString().split('T')[0];
    }

    if (!invoiceData.due_date) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 días por defecto
      invoiceData.due_date = dueDate.toISOString().split('T')[0];
    }

    const invoice = await simpleFACT.invoices.create(invoiceData);

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Factura creada exitosamente'
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Descargar PDF de factura
app.get('/api/invoices/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const pdfBlob = await simpleFACT.invoices.downloadPDF(parseInt(id));

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${id}.pdf"`);

    // Convertir Blob a Buffer para Node.js
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.send(buffer);
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Estadísticas de facturas
app.get('/api/invoices/stats', async (req, res) => {
  try {
    const stats = await simpleFACT.invoices.getStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// ====================================
// API DE PAGOS
// ====================================

// Registrar pago para una factura
app.post('/api/invoices/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    // Validación básica
    if (!paymentData.amount || !paymentData.payment_date) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: amount, payment_date',
        code: 'VALIDATION_ERROR'
      });
    }

    // Establecer método de pago por defecto
    if (!paymentData.payment_method) {
      paymentData.payment_method = 'bank_transfer';
    }

    const payment = await simpleFACT.payments.create(parseInt(id), paymentData);

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Pago registrado exitosamente'
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Listar pagos
app.get('/api/payments', async (req, res) => {
  try {
    const { page = 1, limit = 10, invoice_id } = req.query;

    const response = await simpleFACT.payments.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      invoice_id: invoice_id ? parseInt(invoice_id) : undefined
    });

    res.json({
      success: true,
      data: response.data,
      meta: response.meta
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// ====================================
// API DE VERIFICACIÓN PÚBLICA
// ====================================

// Verificar documento público (sin autenticación)
app.get('/api/verify/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const result = await simpleFACT.verification.verify(hash);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// ====================================
// UTILIDADES Y HELPERS
// ====================================

// Función para procesamiento masivo de facturas
app.post('/api/bulk/invoices', async (req, res) => {
  try {
    const { invoices } = req.body;

    if (!Array.isArray(invoices)) {
      return res.status(400).json({
        success: false,
        error: 'El campo invoices debe ser un array',
        code: 'VALIDATION_ERROR'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < invoices.length; i++) {
      try {
        const invoice = await simpleFACT.invoices.create(invoices[i]);
        results.push({ index: i, invoice });
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        });
      }
    }

    res.json({
      success: true,
      data: {
        processed: results.length,
        failed: errors.length,
        total: invoices.length,
        results,
        errors
      }
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// Sincronización de datos
app.post('/api/sync', async (req, res) => {
  try {
    const { type } = req.body; // 'clients', 'invoices', 'all'

    const syncResults = {
      clients: null,
      invoices: null,
      timestamp: new Date().toISOString()
    };

    if (type === 'clients' || type === 'all') {
      const clientsResponse = await simpleFACT.clients.getAll({ limit: 1000 });
      syncResults.clients = {
        count: clientsResponse.data?.length || 0,
        data: clientsResponse.data
      };
    }

    if (type === 'invoices' || type === 'all') {
      const invoicesResponse = await simpleFACT.invoices.getAll({ limit: 1000 });
      syncResults.invoices = {
        count: invoicesResponse.data?.length || 0,
        data: invoicesResponse.data
      };
    }

    res.json({
      success: true,
      data: syncResults,
      message: 'Sincronización completada'
    });
  } catch (error) {
    handleSDKError(error, res);
  }
});

// ====================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// ====================================

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// ====================================
// INICIALIZACIÓN DEL SERVIDOR
// ====================================

const startServer = async () => {
  try {
    // Verificar conexión con SimpleFact API
    console.log('🔄 Verificando conexión con SimpleFact API...');
    const isHealthy = await simpleFACT.healthCheck();

    if (isHealthy) {
      console.log('✅ Conexión con SimpleFact API establecida');

      // Mostrar información de rate limit
      const rateLimitInfo = simpleFACT.getRateLimitInfo();
      console.log(`📊 Rate Limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests disponibles`);
    } else {
      console.warn('⚠️  SimpleFact API no está disponible, pero el servidor continuará funcionando');
    }

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`📖 Documentación API: http://localhost:${PORT}/health`);
      console.log(`🔧 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Rate limit: http://localhost:${PORT}/api/rate-limit`);

      // Ejemplos de endpoints
      console.log('\n📋 Ejemplos de uso:');
      console.log(`   GET  http://localhost:${PORT}/api/clients`);
      console.log(`   POST http://localhost:${PORT}/api/clients`);
      console.log(`   GET  http://localhost:${PORT}/api/invoices`);
      console.log(`   POST http://localhost:${PORT}/api/invoices`);
      console.log(`   GET  http://localhost:${PORT}/api/invoices/1/pdf`);
      console.log(`   POST http://localhost:${PORT}/api/invoices/1/payments`);
    });

  } catch (error) {
    console.error('❌ Error al inicializar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales del sistema
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();

// ====================================
// EXPORTAR APP PARA TESTING
// ====================================

module.exports = { app, simpleFACT };
