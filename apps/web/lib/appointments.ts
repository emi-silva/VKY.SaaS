import { api } from '@/lib/api';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  type: 'IN_PERSON' | 'TELEMEDICINE';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason?: string;
  notes?: string;
  roomUrl?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    user?: { email: string };
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
    user?: { email: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export const appointmentsApi = {
  list: (params?: {
    startDate?: string;
    endDate?: string;
    doctorId?: string;
    patientId?: string;
    status?: string;
  }) => api.get('/appointments', { params }),

  getById: (id: string) => api.get(`/appointments/${id}`),

  create: (data: {
    patientId: string;
    doctorId: string;
    startTime: string;
    endTime: string;
    type: 'IN_PERSON' | 'TELEMEDICINE';
    reason?: string;
  }) => api.post('/appointments', data),

  update: (id: string, data: {
    status?: string;
    notes?: string;
    startTime?: string;
    endTime?: string;
  }) => api.patch(`/appointments/${id}`, data),

  cancel: (id: string) => api.post(`/appointments/${id}/cancel`),

  getAvailableSlots: (doctorId: string, date: string) =>
    api.get('/appointments/available-slots', { params: { doctorId, date } }),
};

export const scheduleApi = {
  getMySchedule: () => api.get('/schedule/my'),

  getDoctorSchedule: (doctorId: string) =>
    api.get(`/schedule/doctor/${doctorId}`),

  create: (data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive?: boolean;
  }) => api.post('/schedule', data),

  update: (id: string, data: {
    startTime?: string;
    endTime?: string;
    isActive?: boolean;
  }) => api.patch(`/schedule/${id}`, data),

  delete: (id: string) => api.delete(`/schedule/${id}`),
};
