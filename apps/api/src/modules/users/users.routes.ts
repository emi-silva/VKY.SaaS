import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@vky/database';

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
});

const UpdateDoctorSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  consultationFee: z.number().min(0).optional(),
});

export async function userRoutes(app: FastifyInstance) {
  // ============================================
  // OBTENER TODOS LOS USUARIOS (Solo admin)
  // ============================================
  app.get('/users', {
    preHandler: [app.authenticate, app.authorize('users:read')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 10, search, role } = request.query as {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
    };

    const where = {
      ...(role && { role: role as any }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { patient: { firstName: { contains: search, mode: 'insensitive' as const } } },
          { patient: { lastName: { contains: search, mode: 'insensitive' as const } } },
          { doctor: { firstName: { contains: search, mode: 'insensitive' as const } } },
          { doctor: { lastName: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          patient: true,
          doctor: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        firstName: u.patient?.firstName || u.doctor?.firstName,
        lastName: u.patient?.lastName || u.doctor?.lastName,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // ============================================
  // OBTENER USUARIO POR ID
  // ============================================
  app.get('/users/:id', {
    preHandler: [app.authenticate, app.authorize('users:read')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
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
        patient: user.patient,
        doctor: user.doctor,
        createdAt: user.createdAt,
      },
    });
  });

  // ============================================
  // ACTUALIZAR PERFIL DE PACIENTE
  // ============================================
  app.patch('/patients/profile', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as { id: string }).id;
    const body = UpdateUserSchema.parse(request.body);

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return reply.status(404).send({
        success: false,
        error: 'Perfil de paciente no encontrado',
      });
    }

    const updated = await prisma.patient.update({
      where: { userId },
      data: body,
    });

    return reply.send({
      success: true,
      data: updated,
    });
  });

  // ============================================
  // ACTUALIZAR PERFIL DE DOCTOR
  // ============================================
  app.patch('/doctors/profile', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as { id: string }).id;
    const body = UpdateDoctorSchema.parse(request.body);

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return reply.status(404).send({
        success: false,
        error: 'Perfil de doctor no encontrado',
      });
    }

    const updated = await prisma.doctor.update({
      where: { userId },
      data: body,
    });

    return reply.send({
      success: true,
      data: updated,
    });
  });

  // ============================================
  // OBTENER LISTA DE DOCTORES
  // ============================================
  app.get('/doctors', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { specialty, search } = request.query as {
      specialty?: string;
      search?: string;
    };

    const where = {
      ...(specialty && { specialty }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: { email: true },
        },
        schedules: true,
      },
      orderBy: { lastName: 'asc' },
    });

    return reply.send({
      success: true,
      data: doctors,
    });
  });
}
