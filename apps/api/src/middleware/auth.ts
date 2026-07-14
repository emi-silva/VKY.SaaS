import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { defineAbilityFor, Permission } from './permissions.js';

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'Token de autenticación requerido',
      });
    }

    const payload = request.server.jwt.verify<{ id: string; email: string; role: string }>(token);
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Token inválido o expirado',
    });
  }
}

// ============================================
// MIDDLEWARE DE AUTORIZACIÓN (RBAC)
// ============================================
export function authorize(...permissions: Permission[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string } | undefined;

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'No autenticado',
      });
    }

    const ability = defineAbilityFor(user.role);

    const hasPermission = permissions.every((p) => ability.can(p, 'all'));

    if (!hasPermission) {
      return reply.status(403).send({
        success: false,
        error: 'No tienes permisos para realizar esta acción',
      });
    }
  };
}

// ============================================
// REGISTRAR MIDDLEWARES COMO DECORADORES
// ============================================
export async function registerAuthMiddleware(app: FastifyInstance) {
  // Agregar authenticate como decorador
  app.decorate('authenticate', authenticate);

  // Agregar authorize como decorador
  app.decorate('authorize', authorize);
}

// ============================================
// EXTENDER TIPOS DE FASTIFY
// ============================================
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
    authorize: (...permissions: Permission[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
