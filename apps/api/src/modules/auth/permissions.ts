import { AbilityBuilder, createMongoAbility, ExtractSubjectType, Ability } from '@casl/ability';
import { z } from 'zod';

// ============================================
// ROLES Y PERMISOS
// ============================================

export const PermissionSchema = z.enum([
  // Usuarios
  'users:read',
  'users:create',
  'users:update',
  'users:delete',

  // Pacientes
  'patients:read',
  'patients:create',
  'patients:update',
  'patients:delete',

  // Doctores
  'doctors:read',
  'doctors:create',
  'doctors:update',
  'doctors:delete',

  // Turnos
  'appointments:read',
  'appointments:create',
  'appointments:update',
  'appointments:delete',
  'appointments:manage',

  // Historiales médicos
  'medical-records:read',
  'medical-records:create',
  'medical-records:update',
  'medical-records:delete',

  // Facturación
  'billing:read',
  'billing:create',
  'billing:update',
  'billing:delete',
  'billing:manage',

  // Informes
  'reports:read',
  'reports:create',

  // Configuración
  'settings:read',
  'settings:update',

  // Telemedicina
  'telemedicine:read',
  'telemedicine:create',
  'telemedicine:manage',
]);

export type Permission = z.infer<typeof PermissionSchema>;

export type Subjects = 'User' | 'Patient' | 'Doctor' | 'Appointment' | 'MedicalRecord' | 'Invoice' | 'all';

export type AppAbility = Ability<[Permission, Subjects]>;

// ============================================
// DEFINICIONES DE ROLES
// ============================================

const rolePermissions: Record<string, Permission[]> = {
  ADMIN: PermissionSchema.options, // Todos los permisos

  DOCTOR: [
    'patients:read',
    'doctors:read',
    'doctors:update',
    'appointments:read',
    'appointments:update',
    'appointments:manage',
    'medical-records:read',
    'medical-records:create',
    'medical-records:update',
    'billing:read',
    'reports:read',
    'telemedicine:read',
    'telemedicine:create',
  ],

  PATIENT: [
    'patients:read',
    'patients:update', // Solo perfil propio
    'appointments:read',
    'appointments:create',
    'appointments:update', // Solo turnos propios
    'medical-records:read', // Solo historiales propios
    'billing:read', // Solo facturas propias
    'telemedicine:read',
  ],

  RECEPTIONIST: [
    'users:read',
    'patients:read',
    'patients:create',
    'patients:update',
    'doctors:read',
    'appointments:read',
    'appointments:create',
    'appointments:update',
    'appointments:delete',
    'billing:read',
    'billing:create',
    'billing:update',
  ],
};

// ============================================
// CREAR HABILIDAD
// ============================================

export function defineAbilityFor(role: string): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const permissions = rolePermissions[role] || [];

  permissions.forEach((permission) => {
    const [action, subject] = permission.split(':') as [string, Subjects];
    can(action as Permission, subject);
  });

  return build({
    detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
  });
}

// ============================================
// VERIFICAR PERMISOS
// ============================================

export function hasPermission(role: string, permission: Permission): boolean {
  const ability = defineAbilityFor(role);
  return ability.can(permission, 'all');
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
