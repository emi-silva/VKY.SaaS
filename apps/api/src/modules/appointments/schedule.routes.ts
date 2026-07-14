import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@vky/database';

const CreateScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
});

const UpdateScheduleSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isActive: z.boolean().optional(),
});

export async function scheduleRoutes(app: FastifyInstance) {
  // ============================================
  // OBTENER MI HORARIO (Doctor)
  // ============================================
  app.get('/schedule/my', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };

    if (user.role !== 'DOCTOR') {
      return reply.status(403).send({
        success: false,
        error: 'Solo doctores pueden ver su horario',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
    });

    if (!doctor) {
      return reply.status(404).send({
        success: false,
        error: 'Perfil de doctor no encontrado',
      });
    }

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: doctor.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return reply.send({
      success: true,
      data: schedules,
    });
  });

  // ============================================
  // OBTENER HORARIO DEL DOCTOR (Público)
  // ============================================
  app.get('/schedule/doctor/:doctorId', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { doctorId } = request.params as { doctorId: string };

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });

    return reply.send({
      success: true,
      data: schedules,
    });
  });

  // ============================================
  // CREAR/ACTUALIZAR HORARIO
  // ============================================
  app.post('/schedule', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };

    if (user.role !== 'DOCTOR') {
      return reply.status(403).send({
        success: false,
        error: 'Solo doctores pueden gestionar su horario',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
    });

    if (!doctor) {
      return reply.status(404).send({
        success: false,
        error: 'Perfil de doctor no encontrado',
      });
    }

    const body = CreateScheduleSchema.parse(request.body);

    // Validar rango de horarios
    if (body.startTime >= body.endTime) {
      return reply.status(400).send({
        success: false,
        error: 'La hora de inicio debe ser antes de la hora de fin',
      });
    }

    const schedule = await prisma.doctorSchedule.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctor.id,
          dayOfWeek: body.dayOfWeek,
        },
      },
      update: {
        startTime: body.startTime,
        endTime: body.endTime,
        isActive: body.isActive,
      },
      create: {
        doctorId: doctor.id,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        isActive: body.isActive,
      },
    });

    return reply.send({
      success: true,
      data: schedule,
    });
  });

  // ============================================
  // ACTUALIZAR HORARIO
  // ============================================
  app.patch('/schedule/:id', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };

    if (user.role !== 'DOCTOR') {
      return reply.status(403).send({
        success: false,
        error: 'Solo doctores pueden gestionar su horario',
      });
    }

    const body = UpdateScheduleSchema.parse(request.body);

    const schedule = await prisma.doctorSchedule.update({
      where: { id },
      data: body,
    });

    return reply.send({
      success: true,
      data: schedule,
    });
  });

  // ============================================
  // ELIMINAR HORARIO
  // ============================================
  app.delete('/schedule/:id', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };

    if (user.role !== 'DOCTOR') {
      return reply.status(403).send({
        success: false,
        error: 'Solo doctores pueden gestionar su horario',
      });
    }

    await prisma.doctorSchedule.delete({
      where: { id },
    });

    return reply.send({
      success: true,
      message: 'Horario eliminado',
    });
  });
}
