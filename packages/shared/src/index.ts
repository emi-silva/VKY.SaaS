import { z } from 'zod';

// ============================================
// USER SCHEMAS
// ============================================

export const UserRoleSchema = z.enum(['ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

// ============================================
// AUTH SCHEMAS
// ============================================

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  role: UserRoleSchema.default('PATIENT'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const TwoFactorSchema = z.object({
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
  secret: z.string(),
});
export type TwoFactorInput = z.infer<typeof TwoFactorSchema>;

// ============================================
// PATIENT SCHEMAS
// ============================================

export const PatientSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.date().nullable().optional(),
  gender: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
  emergencyPhone: z.string().nullable().optional(),
  bloodType: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  medicalNotes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Patient = z.infer<typeof PatientSchema>;

// ============================================
// DOCTOR SCHEMAS
// ============================================

export const DoctorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable().optional(),
  specialty: z.string(),
  licenseNumber: z.string(),
  bio: z.string().nullable().optional(),
  consultationFee: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Doctor = z.infer<typeof DoctorSchema>;

// ============================================
// APPOINTMENT SCHEMAS
// ============================================

export const AppointmentStatusSchema = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentTypeSchema = z.enum(['IN_PERSON', 'TELEMEDICINE']);
export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;

export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  type: AppointmentTypeSchema,
  status: AppointmentStatusSchema,
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  roomUrl: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: AppointmentTypeSchema,
  reason: z.string().optional(),
});
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

// ============================================
// MEDICAL RECORD SCHEMAS
// ============================================

export const MedicalRecordSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  diagnosis: z.string(),
  symptoms: z.string().nullable().optional(),
  treatment: z.string().nullable().optional(),
  prescription: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MedicalRecord = z.infer<typeof MedicalRecordSchema>;

export const CreateMedicalRecordSchema = z.object({
  appointmentId: z.string(),
  diagnosis: z.string().min(1, 'Diagnóstico requerido'),
  symptoms: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateMedicalRecordInput = z.infer<typeof CreateMedicalRecordSchema>;

// ============================================
// INVOICE SCHEMAS
// ============================================

export const InvoiceStatusSchema = z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  appointmentId: z.string().nullable().optional(),
  amount: z.number(),
  currency: z.string(),
  status: InvoiceStatusSchema,
  description: z.string().nullable().optional(),
  stripeInvoiceId: z.string().nullable().optional(),
  paidAt: z.date().nullable().optional(),
  dueAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// ============================================
// API RESPONSE SCHEMAS
// ============================================

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// ============================================
// PAGINATION
// ============================================

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
