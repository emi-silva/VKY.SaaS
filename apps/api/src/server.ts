import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import { loadEnv } from './config/env.js';
import { registerAuthMiddleware } from './middleware/auth.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { twoFactorRoutes } from './modules/auth/twofa.routes.js';
import { userRoutes } from './modules/users/users.routes.js';
import { appointmentRoutes } from './modules/appointments/appointments.routes.js';
import { scheduleRoutes } from './modules/appointments/schedule.routes.js';
import { telemedicineRoutes } from './modules/telemedicine/telemedicine.routes.js';
import { medicalRecordRoutes } from './modules/medical-records/medical-records.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';

const env = loadEnv();

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // CORS
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  // WebSocket
  await app.register(websocket);

  // Límite de tasa
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Registrar middleware de autenticación
  await registerAuthMiddleware(app);

  // Verificación de salud
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Info de la API
  app.get('/api', async () => {
    return {
      name: 'VKY.SaaS API',
      version: '0.1.0',
      description: 'API para plataforma médica',
      endpoints: {
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          refresh: 'POST /api/auth/refresh',
          logout: 'POST /api/auth/logout',
          me: 'GET /api/auth/me',
          twoFactor: {
            setup: 'POST /api/auth/2fa/setup',
            verify: 'POST /api/auth/2fa/verify',
            disable: 'POST /api/auth/2fa/disable',
            login: 'POST /api/auth/2fa/login',
          },
        },
        users: {
          list: 'GET /api/users',
          get: 'GET /api/users/:id',
          updatePatient: 'PATCH /api/patients/profile',
          updateDoctor: 'PATCH /api/doctors/profile',
          listDoctors: 'GET /api/doctors',
        },
      },
    };
  });

  // Registrar rutas
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(twoFactorRoutes, { prefix: '/api' });
  await app.register(userRoutes, { prefix: '/api' });
  await app.register(appointmentRoutes, { prefix: '/api' });
  await app.register(scheduleRoutes, { prefix: '/api' });
  await app.register(telemedicineRoutes, { prefix: '/api' });
  await app.register(medicalRecordRoutes, { prefix: '/api' });
  await app.register(billingRoutes, { prefix: '/api' });

  return app;
}
