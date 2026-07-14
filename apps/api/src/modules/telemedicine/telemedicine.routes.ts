import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@vky/database';

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;

// Importación dinámica de Twilio (compatible con ESM)
let twilioClient: any = null;

async function getTwilioClient() {
  if (!twilioClient && TWILIO_ACCOUNT_SID && TWILIO_API_KEY && TWILIO_API_SECRET) {
    const twilio = await import('twilio');
    twilioClient = twilio.default(TWILIO_API_KEY, TWILIO_API_SECRET, {
      accountSid: TWILIO_ACCOUNT_SID,
    });
  }
  return twilioClient;
}

const CreateRoomSchema = z.object({
  appointmentId: z.string(),
  roomName: z.string().optional(),
});

export async function telemedicineRoutes(app: FastifyInstance) {
  // ============================================
  // CREAR SALA DE VIDEO
  // ============================================
  app.post('/telemedicine/rooms', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const body = CreateRoomSchema.parse(request.body);

    // Obtener turno
    const appointment = await prisma.appointment.findUnique({
      where: { id: body.appointmentId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      return reply.status(404).send({
        success: false,
        error: 'Cita no encontrada',
      });
    }

    if (appointment.type !== 'TELEMEDICINE') {
      return reply.status(400).send({
        success: false,
        error: 'Esta cita no es de telemedicina',
      });
    }

    // Verificar si la sala ya existe
    if (appointment.roomUrl) {
      return reply.send({
        success: true,
        data: {
          roomSid: appointment.roomUrl,
          roomName: `appointment-${appointment.id}`,
        },
      });
    }

    const roomName = body.roomName || `appointment-${appointment.id}`;

    try {
      const client = await getTwilioClient();
      
      if (!client) {
        // Modo demo - retornar datos de prueba
        const mockRoomSid = `VR_${Date.now()}`;
        await prisma.appointment.update({
          where: { id: body.appointmentId },
          data: { roomUrl: mockRoomSid },
        });

        return reply.send({
          success: true,
          data: {
            roomSid: mockRoomSid,
            roomName,
            demo: true,
          },
        });
      }

      // Crear sala de Twilio
      const room = await client.video.v1.rooms.create({
        uniqueName: roomName,
        type: 'group',
        maxParticipants: 2,
        statusCallback: `${process.env.NEXT_PUBLIC_API_URL}/api/telemedicine/webhook`,
        statusCallbackMethod: 'POST',
      });

      // Actualizar turno con la URL de la sala
      await prisma.appointment.update({
        where: { id: body.appointmentId },
        data: { roomUrl: room.sid },
      });

      return reply.send({
        success: true,
        data: {
          roomSid: room.sid,
          roomName: room.uniqueName,
          status: room.status,
        },
      });
    } catch (error: any) {
      console.error('Error al crear la sala de Twilio:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al crear la sala de video',
      });
    }
  });

  // ============================================
  // OBTENER TOKEN DE ACCESO
  // ============================================
  app.post('/telemedicine/token', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const { roomSid, identity } = request.body as { roomSid: string; identity?: string };

    if (!roomSid) {
      return reply.status(400).send({
        success: false,
        error: 'roomSid es requerido',
      });
    }

    try {
      const client = await getTwilioClient();
      
      if (!client) {
        // Modo demo
        return reply.send({
          success: true,
          data: {
            token: 'demo-token',
            roomSid,
            identity: identity || user.id,
            demo: true,
          },
        });
      }

      // Obtener info del usuario para la identidad
      const userInfo = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { firstName: true, lastName: true } },
        },
      });

      const userIdentity = identity || 
        `${userInfo?.patient?.firstName || userInfo?.doctor?.firstName || 'Usuario'} ${
          userInfo?.patient?.lastName || userInfo?.doctor?.lastName || user.id
        }`;

      // Crear token de acceso
      const AccessToken = (await import('twilio')).AccessToken;
      const VideoGrant = (await import('twilio')).VideoGrant;

      const token = new AccessToken(
        TWILIO_ACCOUNT_SID!,
        TWILIO_API_KEY!,
        TWILIO_API_SECRET!,
        {
          identity: userIdentity,
          ttl: 14400, // 4 horas
        }
      );

      const videoGrant = new VideoGrant({
        room: roomSid,
      });

      token.addGrant(videoGrant);

      return reply.send({
        success: true,
        data: {
          token: token.toJwt(),
          roomSid,
          identity: userIdentity,
        },
      });
    } catch (error: any) {
      console.error('Error al generar el token:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al generar el token',
      });
    }
  });

  // ============================================
  // CERRAR SALA DE VIDEO
  // ============================================
  app.post('/telemedicine/rooms/:roomSid/end', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { roomSid } = request.params as { roomSid: string };

    try {
      const client = await getTwilioClient();
      
      if (!client) {
        // Modo demo
        return reply.send({
          success: true,
          message: 'Sala cerrada (modo demo)',
        });
      }

      // Finalizar la sala
      await client.video.v1.rooms(roomSid).update({ status: 'completed' });

      return reply.send({
        success: true,
        message: 'Sala cerrada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al cerrar la sala:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al cerrar la sala',
      });
    }
  });

  // ============================================
  // OBTENER PARTICIPANTES DE LA SALA
  // ============================================
  app.get('/telemedicine/rooms/:roomSid/participants', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { roomSid } = request.params as { roomSid: string };

    try {
      const client = await getTwilioClient();
      
      if (!client) {
        // Modo demo
        return reply.send({
          success: true,
          data: [],
        });
      }

      const participants = await client.video.v1
        .rooms(roomSid)
        .participants.list();

      return reply.send({
        success: true,
        data: participants.map((p: any) => ({
          sid: p.sid,
          identity: p.identity,
          status: p.status,
          startTime: p.startTime,
        })),
      });
    } catch (error: any) {
      console.error('Error al obtener participantes:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener participantes',
      });
    }
  });

  // ============================================
  // WEBHOOK - Actualizaciones de estado de sala
  // ============================================
  app.post('/telemedicine/webhook', async (request: FastifyRequest, reply: FreeReply) => {
    const { StatusCallbackEvent, RoomSid, RoomName } = request.body as any;

    console.log('Webhook de Twilio:', { StatusCallbackEvent, RoomSid, RoomName });

    // Manejar eventos de sala
    switch (StatusCallbackEvent) {
      case 'room-created':
        console.log('Sala creada:', RoomSid);
        break;
      case 'room-ended':
        console.log('Sala finalizada:', RoomSid);
        // Actualizar estado del turno si es necesario
        break;
      case 'participant-connected':
        console.log('Participante conectado a la sala:', RoomSid);
        break;
      case 'participant-disconnected':
        console.log('Participante desconectado de la sala:', RoomSid);
        break;
    }

    return reply.send({ status: 'ok' });
  });

  // ============================================
  // OBTENER SALAS ACTIVAS
  // ============================================
  app.get('/telemedicine/rooms/active', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FreeReply) => {
    try {
      const client = await getTwilioClient();
      
      if (!client) {
        // Modo demo - retornar turnos de telemedicina de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await prisma.appointment.findMany({
          where: {
            type: 'TELEMEDICINE',
            startTime: { gte: today, lt: tomorrow },
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          },
          include: {
            patient: true,
            doctor: true,
          },
        });

        return reply.send({
          success: true,
          data: appointments.map((apt) => ({
            roomSid: apt.roomUrl || `VR_${apt.id}`,
            roomName: `appointment-${apt.id}`,
            appointmentId: apt.id,
            patient: apt.patient,
            doctor: apt.doctor,
            status: apt.status,
          })),
        });
      }

      const rooms = await client.video.v1.rooms.list({
        status: 'in-progress',
      });

      return reply.send({
        success: true,
        data: rooms.map((room: any) => ({
          roomSid: room.sid,
          roomName: room.uniqueName,
          status: room.status,
          participants: room.participants,
        })),
      });
    } catch (error: any) {
      console.error('Error al obtener salas activas:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener salas activas',
      });
    }
  });
}
