import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@vky/database';

const CreateAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum(['IN_PERSON', 'TELEMEDICINE']),
  reason: z.string().optional(),
});

const UpdateAppointmentSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

export async function appointmentRoutes(app: FastifyInstance) {
  // ============================================
  // OBTENER TODOS LOS TURNOS
  // ============================================
  app.get('/appointments', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const { startDate, endDate, doctorId, patientId, status } = request.query as {
      startDate?: string;
      endDate?: string;
      doctorId?: string;
      patientId?: string;
      status?: string;
    };

    const where: any = {};

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    // Filtrar por doctor
    if (doctorId) where.doctorId = doctorId;

    // Filtrar por paciente
    if (patientId) where.patientId = patientId;

    // Filtrar por estado
    if (status) where.status = status;

    // Filtrado por rol
    if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      if (doctor) where.doctorId = doctor.id;
    } else if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (patient) where.patientId = patient.id;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: { user: { select: { email: true } } },
        },
        doctor: {
          include: { user: { select: { email: true } } },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return reply.send({
      success: true,
      data: appointments,
    });
  });

  // ============================================
  // OBTENER UN TURNO
  // ============================================
  app.get('/appointments/:id', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: { select: { email: true } } },
        },
        doctor: {
          include: { user: { select: { email: true } } },
        },
        medicalRecord: true,
      },
    });

    if (!appointment) {
      return reply.status(404).send({
        success: false,
        error: 'Cita no encontrada',
      });
    }

    return reply.send({
      success: true,
      data: appointment,
    });
  });

  // ============================================
  // CREAR TURNO
  // ============================================
  app.post('/appointments', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CreateAppointmentSchema.parse(request.body);

    // Validar que el doctor existe
    const doctor = await prisma.doctor.findUnique({
      where: { id: body.doctorId },
    });

    if (!doctor) {
      return reply.status(404).send({
        success: false,
        error: 'Doctor no encontrado',
      });
    }

    // Validar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId },
    });

    if (!patient) {
      return reply.status(404).send({
        success: false,
        error: 'Paciente no encontrado',
      });
    }

    // Verificar conflictos de turnos
    const conflicting = await prisma.appointment.findFirst({
      where: {
        doctorId: body.doctorId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            startTime: { lte: new Date(body.startTime) },
            endTime: { gt: new Date(body.startTime) },
          },
          {
            startTime: { lt: new Date(body.endTime) },
            endTime: { gte: new Date(body.endTime) },
          },
          {
            startTime: { gte: new Date(body.startTime) },
            endTime: { lte: new Date(body.endTime) },
          },
        ],
      },
    });

    if (conflicting) {
      return reply.status(409).send({
        success: false,
        error: 'El doctor ya tiene una cita en ese horario',
      });
    }

    // Verificar disponibilidad del horario del doctor
    const appointmentDate = new Date(body.startTime);
    const dayOfWeek = appointmentDate.getDay();
    const startTimeStr = appointmentDate.toTimeString().slice(0, 5);

    const schedule = await prisma.doctorSchedule.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: body.doctorId,
          dayOfWeek,
        },
      },
    });

    if (!schedule || !schedule.isActive) {
      return reply.status(400).send({
        success: false,
        error: 'El doctor no atiende ese día',
      });
    }

    if (startTimeStr < schedule.startTime || startTimeStr >= schedule.endTime) {
      return reply.status(400).send({
        success: false,
        error: 'El horario está fuera de la disponibilidad del doctor',
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: body.patientId,
        doctorId: body.doctorId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        type: body.type,
        reason: body.reason,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return reply.status(201).send({
      success: true,
      data: appointment,
    });
  });

  // ============================================
  // ACTUALIZAR TURNO
  // ============================================
  app.patch('/appointments/:id', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = UpdateAppointmentSchema.parse(request.body);

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Cita no encontrada',
      });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...body,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return reply.send({
      success: true,
      data: appointment,
    });
  });

  // ============================================
  // CANCELAR TURNO
  // ============================================
  app.post('/appointments/:id/cancel', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Cita no encontrada',
      });
    }

    if (existing.status === 'CANCELLED') {
      return reply.status(400).send({
        success: false,
        error: 'La cita ya está cancelada',
      });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return reply.send({
      success: true,
      data: appointment,
      message: 'Cita cancelada exitosamente',
    });
  });

  // ============================================
  // OBTENER HORARIOS DISPONIBLES
  // ============================================
  app.get('/appointments/available-slots', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { doctorId, date } = request.query as { doctorId: string; date: string };

    if (!doctorId || !date) {
      return reply.status(400).send({
        success: false,
        error: 'doctorId y date son requeridos',
      });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    // Obtener horario del doctor para ese día
    const schedule = await prisma.doctorSchedule.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId,
          dayOfWeek,
        },
      },
    });

    if (!schedule || !schedule.isActive) {
      return reply.send({
        success: true,
        data: [],
        message: 'El doctor no atiende este día',
      });
    }

    // Obtener turnos existentes para ese día
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generar horarios disponibles (intervalos de 30 minutos)
    const slots: string[] = [];
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const slotTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const slotDateTime = new Date(date);
      slotDateTime.setHours(currentHour, currentMinute, 0, 0);

      const slotEndDateTime = new Date(slotDateTime);
      slotEndDateTime.setMinutes(slotEndDateTime.getMinutes() + 30);

      // Verificar si el horario está disponible
      const isOccupied = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return slotDateTime < aptEnd && slotEndDateTime > aptStart;
      });

      // Verificar si el horario ya pasó
      const now = new Date();
      const isPast = slotDateTime <= now;

      if (!isOccupied && !isPast) {
        slots.push(slotTime);
      }

      // Avanzar al siguiente horario
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return reply.send({
      success: true,
      data: slots,
    });
  });
}
