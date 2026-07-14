import { api } from '@/lib/api';

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
  attachments?: string[];
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: { email: string };
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
    user?: { email: string };
  };
  appointment?: {
    startTime: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PatientSummary {
  patient: {
    firstName: string;
    lastName: string;
    bloodType?: string;
    allergies?: string;
    medicalNotes?: string;
  };
  stats: {
    totalRecords: number;
    lastVisit: string | null;
  };
  recentRecords: MedicalRecord[];
  topDiagnoses: Array<{ diagnosis: string; count: number }>;
}

export const medicalRecordsApi = {
  list: (params?: { patientId?: string; doctorId?: string; page?: number; limit?: number }) =>
    api.get('/medical-records', { params }),

  getById: (id: string) =>
    api.get(`/medical-records/${id}`),

  create: (data: {
    appointmentId: string;
    diagnosis: string;
    symptoms?: string;
    treatment?: string;
    prescription?: string;
    notes?: string;
  }) => api.post('/medical-records', data),

  update: (id: string, data: {
    diagnosis?: string;
    symptoms?: string;
    treatment?: string;
    prescription?: string;
    notes?: string;
  }) => api.patch(`/medical-records/${id}`, data),

  delete: (id: string) =>
    api.delete(`/medical-records/${id}`),

  getPatientHistory: (patientId: string) =>
    api.get(`/medical-records/patient/${patientId}/history`),

  getPatientSummary: (patientId: string) =>
    api.get(`/medical-records/patient/${patientId}/summary`),
};
