import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@vky/database';

const CreateMedicalRecordSchema = z.object({
  appointmentId: z.string(),
  diagnosis: z.string().min(1, 'Diagnóstico requerido'),
  symptoms: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateMedicalRecordSchema = z.object({
  diagnosis: z.string().min(1).optional(),
  symptoms: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

export async function medicalRecordRoutes(app: FastifyInstance) {
  // ============================================
  // OBTENER TODOS LOS HISTORIALES MÉDICOS
  // ============================================
  app.get('/medical-records', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const { patientId, doctorId, page = 1, limit = 10 } = request.query as {
      patientId?: string;
      doctorId?: string;
      page?: number;
      limit?: number;
    };

    const where: any = {};

    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    // Filtrado por rol
    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (patient) where.patientId = patient.id;
    } else if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      if (doctor) where.doctorId = doctor.id;
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        include: {
          patient: {
            include: { user: { select: { email: true } } },
          },
          doctor: {
            include: { user: { select: { email: true } } },
          },
          appointment: {
            select: { startTime: true, type: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // ============================================
  // OBTENER UN HISTORIAL MÉDICO
  // ============================================
  app.get('/medical-records/:id', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: { select: { email: true } } },
        },
        doctor: {
          include: { user: { select: { email: true } } },
        },
        appointment: true,
      },
    });

    if (!record) {
      return reply.status(404).send({
        success: false,
        error: 'Historial no encontrado',
      });
    }

    return reply.send({
      success: true,
      data: record,
    });
  });

  // ============================================
  // CREAR HISTORIAL MÉDICO
  // ============================================
  app.post('/medical-records', {
    preHandler: [app.authenticate, app.authorize('medical-records:create')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const body = CreateMedicalRecordSchema.parse(request.body);

    // Obtener doctor del usuario
    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
    });

    if (!doctor) {
      return reply.status(403).send({
        success: false,
        error: 'Solo doctores pueden crear historiales',
      });
    }

    // Obtener turno para encontrar al paciente
    const appointment = await prisma.appointment.findUnique({
      where: { id: body.appointmentId },
    });

    if (!appointment) {
      return reply.status(404).send({
        success: false,
        error: 'Cita no encontrada',
      });
    }

    // Verificar si ya existe un historial para este turno
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { appointmentId: body.appointmentId },
    });

    if (existingRecord) {
      return reply.status(409).send({
        success: false,
        error: 'Ya existe un historial para esta cita',
      });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        appointmentId: body.appointmentId,
        patientId: appointment.patientId,
        doctorId: doctor.id,
        diagnosis: body.diagnosis,
        symptoms: body.symptoms,
        treatment: body.treatment,
        prescription: body.prescription,
        notes: body.notes,
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });

    return reply.status(201).send({
      success: true,
      data: record,
    });
  });

  // ============================================
  // ACTUALIZAR HISTORIAL MÉDICO
  // ============================================
  app.patch('/medical-records/:id', {
    preHandler: [app.authenticate, app.authorize('medical-records:update')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = UpdateMedicalRecordSchema.parse(request.body);

    const existing = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Historial no encontrado',
      });
    }

    const record = await prisma.medicalRecord.update({
      where: { id },
      data: body,
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });

    return reply.send({
      success: true,
      data: record,
    });
  });

  // ============================================
  // ELIMINAR HISTORIAL MÉDICO
  // ============================================
  app.delete('/medical-records/:id', {
    preHandler: [app.authenticate, app.authorize('medical-records:delete')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Historial no encontrado',
      });
    }

    await prisma.medicalRecord.delete({
      where: { id },
    });

    return reply.send({
      success: true,
      message: 'Historial eliminado',
    });
  });

  // ============================================
  // OBTENER HISTORIAL MÉDICO DEL PACIENTE
  // ============================================
  app.get('/medical-records/patient/:patientId/history', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { patientId } = request.params as { patientId: string };

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        appointment: {
          select: {
            startTime: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar por año
    const groupedByYear = records.reduce((acc, record) => {
      const year = new Date(record.createdAt).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(record);
      return acc;
    }, {} as Record<number, typeof records>);

    return reply.send({
      success: true,
      data: {
        records,
        groupedByYear,
        total: records.length,
      },
    });
  });

  // ============================================
  // OBTENER RESUMEN DEL PACIENTE
  // ============================================
  app.get('/medical-records/patient/:patientId/summary', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { patientId } = request.params as { patientId: string };

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return reply.status(404).send({
        success: false,
        error: 'Paciente no encontrado',
      });
    }

    const [totalRecords, recentRecords, diagnoses] = await Promise.all([
      prisma.medicalRecord.count({ where: { patientId } }),
      prisma.medicalRecord.findMany({
        where: { patientId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.medicalRecord.groupBy({
        by: ['diagnosis'],
        where: { patientId },
        _count: { diagnosis: true },
        orderBy: { _count: { diagnosis: 'desc' } },
        take: 10,
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        patient: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          bloodType: patient.bloodType,
          allergies: patient.allergies,
          medicalNotes: patient.medicalNotes,
        },
        stats: {
          totalRecords,
          lastVisit: recentRecords[0]?.createdAt || null,
        },
        recentRecords,
        topDiagnoses: diagnoses.map((d) => ({
          diagnosis: d.diagnosis,
          count: d._count.diagnosis,
        })),
      },
    });
  });
}
