import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@vky/database';
import { LoginSchema, RegisterSchema } from '@vky/shared';

export async function authRoutes(app: FastifyInstance) {
  // ============================================
  // REGISTRO
  // ============================================
  app.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = RegisterSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: 'El email ya está registrado',
      });
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: body.role,
        patient: body.role === 'PATIENT' ? {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
          },
        } : undefined,
        doctor: body.role === 'DOCTOR' ? {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            specialty: 'General',
            licenseNumber: `TEMP-${Date.now()}`,
          },
        } : undefined,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    const refreshToken = app.jwt.sign(
      { id: user.id, type: 'refresh' },
      { expiresIn: '30d' }
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: body.firstName,
          lastName: body.lastName,
        },
        token,
        refreshToken,
      },
    });
  });

  // ============================================
  // INICIO DE SESIÓN
  // ============================================
  app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = LoginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    const isValidPassword = await bcrypt.compare(body.password, user.password);

    if (!isValidPassword) {
      return reply.status(401).send({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    if (user.twoFactorEnabled) {
      const tempToken = app.jwt.sign(
        { id: user.id, type: '2fa_pending' },
        { expiresIn: '5m' }
      );

      return reply.send({
        success: true,
        data: {
          requiresTwoFactor: true,
          tempToken,
        },
      });
    }

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    const refreshToken = app.jwt.sign(
      { id: user.id, type: 'refresh' },
      { expiresIn: '30d' }
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.patient?.firstName || user.doctor?.firstName,
          lastName: user.patient?.lastName || user.doctor?.lastName,
        },
        token,
        refreshToken,
      },
    });
  });

  // ============================================
  // RENOVAR TOKEN
  // ============================================
  app.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: 'Refresh token requerido',
      });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return reply.status(401).send({
        success: false,
        error: 'Token inválido o expirado',
      });
    }

    const payload = app.jwt.verify<{ id: string }>(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const newToken = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    const newRefreshToken = app.jwt.sign(
      { id: user.id, type: 'refresh' },
      { expiresIn: '30d' }
    );

    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return reply.send({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  });

  // ============================================
  // CIERRE DE SESIÓN
  // ============================================
  app.post('/auth/logout', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    return reply.send({
      success: true,
      message: 'Sesión cerrada',
    });
  });

  // ============================================
  // ME (Obtener usuario actual)
  // ============================================
  app.get('/auth/me', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as { id: string }).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    return reply.send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        firstName: user.patient?.firstName || user.doctor?.firstName,
        lastName: user.patient?.lastName || user.doctor?.lastName,
        patient: user.patient,
        doctor: user.doctor,
      },
    });
  });
}
