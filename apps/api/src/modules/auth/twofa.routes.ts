import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@vky/database';

export async function twoFactorRoutes(app: FastifyInstance) {
  // ============================================
  // CONFIGURAR 2FA - Generar secreto
  // ============================================
  app.post('/auth/2fa/setup', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as { id: string }).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    if (user.twoFactorEnabled) {
      return reply.status(400).send({
        success: false,
        error: '2FA ya está habilitado',
      });
    }

    const secret = speakeasy.generateSecret({
      name: `VKY.SaaS (${user.email})`,
      issuer: process.env.TOTP_ISSUER || 'VKY.SaaS',
      length: 20,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return reply.send({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        otpauthUrl: secret.otpauth_url,
      },
    });
  });

  // ============================================
  // VERIFICAR 2FA - Habilitar después de la verificación
  // ============================================
  app.post('/auth/2fa/verify', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as { id: string }).id;
    const { code } = request.body as { code: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      return reply.status(400).send({
        success: false,
        error: 'Primero debes generar un secreto 2FA',
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return reply.status(400).send({
        success: false,
        error: 'Código inválido',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return reply.send({
      success: true,
      message: '2FA habilitado correctamente',
    });
  });

  // ============================================
  // DESHABILITAR 2FA
  // ============================================
  app.post('/auth/2fa/disable', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as { id: string }).id;
    const { code } = request.body as { code: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      return reply.status(400).send({
        success: false,
        error: '2FA no está habilitado',
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return reply.status(400).send({
        success: false,
        error: 'Código inválido',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return reply.send({
      success: true,
      message: '2FA deshabilitado correctamente',
    });
  });

  // ============================================
  // INICIO DE SESIÓN CON 2FA
  // ============================================
  app.post('/auth/2fa/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tempToken, code } = request.body as { tempToken: string; code: string };

    if (!tempToken || !code) {
      return reply.status(400).send({
        success: false,
        error: 'Token temporal y código requeridos',
      });
    }

    let payload: { id: string; type: string };
    try {
      payload = app.jwt.verify<{ id: string; type: string }>(tempToken);
    } catch {
      return reply.status(401).send({
        success: false,
        error: 'Token expirado o inválido',
      });
    }

    if (payload.type !== '2fa_pending') {
      return reply.status(400).send({
        success: false,
        error: 'Token inválido',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user || !user.twoFactorSecret) {
      return reply.status(400).send({
        success: false,
        error: 'Usuario no encontrado o 2FA no configurado',
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return reply.status(400).send({
        success: false,
        error: 'Código 2FA inválido',
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
}
