import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Poblando base de datos...');

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vky-saas.com' },
    update: {},
    create: {
      email: 'admin@vky-saas.com',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('✅ Usuario admin creado:', admin.email);

  // Crear doctor de demostración
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@vky-saas.com' },
    update: {},
    create: {
      email: 'doctor@vky-saas.com',
      password: doctorPassword,
      role: 'DOCTOR',
      emailVerified: true,
      doctor: {
        create: {
          firstName: 'Carlos',
          lastName: 'García',
          specialty: 'Medicina General',
          licenseNumber: 'MED-001',
          consultationFee: 85,
          bio: 'Doctor con 10 años de experiencia',
        },
      },
    },
    include: { doctor: true },
  });
  console.log('✅ Usuario doctor creado:', doctorUser.email);

  // Crear paciente de demostración
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@vky-saas.com' },
    update: {},
    create: {
      email: 'patient@vky-saas.com',
      password: patientPassword,
      role: 'PATIENT',
      emailVerified: true,
      patient: {
        create: {
          firstName: 'María',
          lastName: 'López',
          phone: '+5491155551234',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'F',
          bloodType: 'A+',
          allergies: 'Penicilina',
        },
      },
    },
    include: { patient: true },
  });
  console.log('✅ Usuario paciente creado:', patientUser.email);

  // Crear horarios del doctor (lunes a viernes, 9 a 17 hs)
  if (doctorUser.doctor) {
    for (let day = 1; day <= 5; day++) {
      await prisma.doctorSchedule.upsert({
        where: {
          doctorId_dayOfWeek: {
            doctorId: doctorUser.doctor.id,
            dayOfWeek: day,
          },
        },
        update: {},
        create: {
          doctorId: doctorUser.doctor.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
        },
      });
    }
    console.log('✅ Horarios del doctor creados');
  }

  // Crear clínica por defecto
  await prisma.clinic.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Centro Médico VKY',
      email: 'info@vky-saas.com',
      phone: '+5491155550000',
      address: 'Av. Corrientes 1234',
      city: 'Buenos Aires',
      state: 'CABA',
      zipCode: 'C1043',
      country: 'AR',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'USD',
    },
  });
  console.log('✅ Clínica por defecto creada');

  console.log('🎉 ¡Poblado completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error al poblar:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
