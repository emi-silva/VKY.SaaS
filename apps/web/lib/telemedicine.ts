import { api } from '@/lib/api';

export interface VideoRoom {
  roomSid: string;
  roomName: string;
  appointmentId?: string;
  patient?: any;
  doctor?: any;
  status?: string;
}

export interface VideoToken {
  token: string;
  roomSid: string;
  identity: string;
  demo?: boolean;
}

export const telemedicineApi = {
  // Crear sala de video para cita
  createRoom: (appointmentId: string, roomName?: string) =>
    api.post('/telemedicine/rooms', { appointmentId, roomName }),

  // Obtener token de acceso para la sala
  getToken: (roomSid: string, identity?: string) =>
    api.post('/telemedicine/token', { roomSid, identity }),

  // Finalizar sala de video
  endRoom: (roomSid: string) =>
    api.post(`/telemedicine/rooms/${roomSid}/end`),

  // Obtener participantes de la sala
  getParticipants: (roomSid: string) =>
    api.get(`/telemedicine/rooms/${roomSid}/participants`),

  // Obtener salas activas
  getActiveRooms: () =>
    api.get('/telemedicine/rooms/active'),
};
