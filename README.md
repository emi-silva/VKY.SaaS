<div align="center">

# VKY.SaaS

### Plataforma SaaS para Clínicas Médicas

**Telemedicina · Agenda Online · Historiales Digitales · Facturación Automática**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![Fastify](https://img.shields.io/badge/Fastify-4-000?style=flat&logo=fastify)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat&logo=prisma)
![Stripe](https://img.shields.io/badge/Stripe-Pagos-635BFF?style=flat&logo=stripe)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat&logo=tailwindcss)

Desarrollado por **Es-Web Desarrollo de Software**

</div>

---

## ¿Qué es VKY.SaaS?

VKY.SaaS es una plataforma completa para la gestión de clínicas médicas. Está pensada para modernizar la forma en que las clínicas trabajan: desde agendar turnos por internet hasta hacer videollamadas con pacientes, pasar historiales digitales y facturar todo automáticamente.

La plataforma funciona como un **SaaS (Software as a Service)**, lo que significa que cada clínica tiene su propia cuenta, sus doctores, sus pacientes y toda la información separada. Se puede acceder desde cualquier navegador, tanto en computadora como en celular o tablet.

---

## Funcionalidades Principales

### 1. Autenticación y Seguridad
- Registro e inicio de sesión con email y contraseña
- Autenticación por JWT (tokens de acceso + refresh tokens)
- **Doble factor de autenticación (2FA)** con códigos TOTP (compatible con Google Authenticator, Authy, etc.)
- Sistema de permisos por roles con **CASL**:
  - **Admin**: acceso total al sistema
  - **Doctor**: gestiona sus pacientes, turnos e historiales
  - **Paciente**: agenda turnos, ve sus historiales y paga facturas
  - **Recepcionista**: administra turnos y facturación

### 2. Agenda y Turnos Online
- Calendario interactivo para ver y gestionar turnos
- Los pacientes pueden **agendar turnos por internet** 24/7
- Los doctores configuran su **horario semanal** (días y horarios disponibles)
- Sistema de confirmación, cancelación e inicio de turnos
- Verificación automática de disponibilidad del doctor
- Turnos presenciales o por telemedicina

### 3. Telemedicina (Videollamadas)
- Videollamadas HD integradas con **Twilio Video**
- Sala de espera virtual (el doctor entra primero, el paciente lo espera)
- Chat en tiempo real durante la consulta
- Controles de micrófono y cámara
- Al finalizar, el doctor puede crear directamente el historial médico
- **Modo demo** disponible sin necesidad de credenciales de Twilio

### 4. Historiales Médicos Digitales
- Creación de historiales con diagnóstico, síntomas, tratamiento y recetas
- Línea de tiempo del historial médico de cada paciente
- Resumen del paciente (tipo de sangre, alergias, estadísticas)
- Diagnósticos más frecuentes
- **Vista de receta** con formato para imprimir
- Adjuntos y notas adicionales

### 5. Facturación con Stripe
- Creación de facturas automatizadas
- Registro de pagos (efectivo, tarjeta, transferencia, seguro, Stripe)
- **Pasarela de pago online** con Stripe Checkout
- Webhooks de Stripe para actualización automática de estados
- Dashboard de estadísticas: ingresos mensuales, pendientes, pagadas, vencidas
- **Modo demo** disponible sin necesidad de credenciales de Stripe

### 6. Panel de Control (Dashboard)
- Vista general con estadísticas rápidas
- Accesos directos a las funcionalidades principales
- Tarjeta de perfil del usuario
- Próximas citas y actividad reciente
- Diseño responsive para celular, tablet y computadora

### 7. Landing Page
- Página de presentación profesional y moderna
- Sección de funcionalidades, cómo funciona, estadísticas
- **3 planes de precios** con suscripción mensual en USD:
  - **Básico**: US$83/mes — 1 doctor, 50 citas, historiales básicos
  - **Profesional**: US$168/mes — 5 doctores, citas ilimitadas, telemedicina, facturación
  - **Enterprise**: US$423/mes — doctores ilimitados, API, soporte 24/7
- Totalmente responsive para todos los dispositivos

---

## Arquitectura del Proyecto

El proyecto está organizado como un **monorepo** usando **pnpm workspaces** y **Turborepo** para gestionar múltiples paquetes de forma eficiente.

```
vky.saas/
├── apps/
│   ├── web/                    # Frontend (Next.js 14 + React)
│   └── api/                    # Backend (Fastify + Prisma)
├── packages/
│   ├── database/               # Schema de Prisma + migraciones + seed
│   └── shared/                 # Utilidades compartidas
├── docker/                     # Configuración de Docker
├── turbo.json                  # Configuración de Turborepo
├── pnpm-workspace.yaml         # Workspaces de pnpm
└── package.json                # Scripts raíz
```

### Frontend (`apps/web`)
| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 14 | Framework React con SSR/SSG |
| React | 18 | Librería de interfaces |
| Tailwind CSS | 3 | Estilos utility-first |
| Zustand | 4 | Estado global (client-side) |
| Axios | 1.7 | Cliente HTTP |
| Twilio Video | 2.28 | Videollamadas |
| date-fns | 3 | Manejo de fechas |
| react-hook-form | 7 | Formularios |

### Backend (`apps/api`)
| Tecnología | Versión | Uso |
|---|---|---|
| Fastify | 4 | Servidor HTTP de alto rendimiento |
| Prisma | 5 | ORM para PostgreSQL |
| PostgreSQL | 16 | Base de datos relacional |
| Zod | 3 | Validación de esquemas |
| CASL | 6 | Control de acceso (RBAC) |
| Stripe | 17 | Pasarela de pagos |
| Twilio | 5 | Servicio de telemedicina |
| speakeasy | 2 | Generación de códigos 2FA |
| bcryptjs | 2 | Hash de contraseñas |

### Paquetes compartidos
- **`@vky/database`**: Contiene el esquema de Prisma, migraciones, y el script de seed (poblado de datos de prueba)
- **`@vky/shared`**: Utilidades compartidas entre frontend y backend

---

## Estructura de la Base de Datos

La base de datos PostgreSQL tiene las siguientes tablas principales:

| Modelo | Descripción |
|---|---|
| `User` | Usuarios del sistema (admin, doctor, paciente, recepcionista) |
| `RefreshToken` | Tokens de refresco para mantener la sesión |
| `Patient` | Datos personales del paciente (nombre, teléfono, sangre, alergias) |
| `Doctor` | Datos del doctor (especialidad, matrícula, honorarios) |
| `DoctorSchedule` | Horarios semanales del doctor (día + hora inicio/fin) |
| `Appointment` | Turnos/citas (paciente, doctor, fecha, tipo, estado) |
| `MedicalRecord` | Historiales médicos (diagnóstico, tratamiento, receta) |
| `Invoice` | Facturas (monto, moneda USD, estado, vencimiento) |
| `Payment` | Pagos registrados (monto, método, referencia Stripe) |
| `Notification` | Notificaciones (email, SMS, push) |
| `Clinic` | Configuración de la clínica (datos, timezone, moneda) |

### Estados de los turnos
`SCHEDULED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED` (o `CANCELLED` / `NO_SHOW`)

### Estados de las facturas
`PENDING` → `PAID` (o `OVERDUE` / `CANCELLED` / `REFUNDED`)

---

## Instalación y Configuración

### Requisitos previos
- **Node.js** >= 18
- **pnpm** >= 11 (se instala automáticamente con `corepack enable`)
- **PostgreSQL** >= 14 (o usar Docker)
- **Docker** (opcional, para la base de datos)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/vky.saas.git
cd vky.saas
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las variables según tu configuración
```

Las variables principales son:

```env
# Base de datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vky_saas?schema=public"

# API
API_PORT=3001
CORS_ORIGIN="http://localhost:3000"

# JWT (cambiar en producción)
JWT_SECRET="tu-secreto-super-seguro"

# Stripe (opcional, funciona en modo demo sin esto)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Twilio (opcional, funciona en modo demo sin esto)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_API_KEY="SK..."
TWILIO_API_SECRET="..."
```

### 4. Levantar la base de datos (con Docker)
```bash
pnpm docker:up
```

O si ya tenés PostgreSQL corriendo localmente, solo asegurate de que la base de datos `vky_saas` exista.

### 5. Generar el cliente de Prisma y crear las tablas
```bash
pnpm db:generate
pnpm db:push
```

### 6. Poblar la base de datos con datos de prueba
```bash
pnpm db:seed
```

Esto crea:
- **Admin**: `admin@vky-saas.com` / `admin123`
- **Doctor**: `doctor@vky-saas.com` / `doctor123`
- **Paciente**: `patient@vky-saas.com` / `patient123`
- **Clínica**: Centro Médico VKY (Buenos Aires, Argentina)
- **Horarios**: Lunes a viernes de 9 a 17 horas

### 7. Iniciar el desarrollo
```bash
# Levantar frontend y backend juntos
pnpm dev

# O por separado:
pnpm dev:web    # Frontend en http://localhost:3000
pnpm dev:api    # Backend en http://localhost:3001
```

---

## Scripts Disponibles

| Script | Descripción |
|---|---|
| `pnpm dev` | Levanta frontend y backend en modo desarrollo |
| `pnpm dev:web` | Levanta solo el frontend (puerto 3000) |
| `pnpm dev:api` | Levanta solo el backend (puerto 3001) |
| `pnpm build` | Compila todo el proyecto para producción |
| `pnpm lint` | Corre el linter en todos los paquetes |
| `pnpm lint:fix` | Corre el linter y arregla automáticamente |
| `pnpm format` | Formatea el código con Prettier |
| `pnpm db:generate` | Genera el cliente de Prisma |
| `pnpm db:push` | sincroniza el esquema con la base de datos |
| `pnpm db:migrate` | Corre las migraciones de Prisma |
| `pnpm db:seed` | Pobla la base de datos con datos de prueba |
| `pnpm docker:up` | Levanta los contenedores de Docker |
| `pnpm docker:down` | Detiene los contenedores de Docker |

---

## Estructura de Carpetas del Frontend

```
apps/web/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   ├── login/page.tsx          # Inicio de sesión
│   │   ├── register/page.tsx       # Registro
│   │   └── 2fa/page.tsx            # Verificación de doble factor
│   └── dashboard/
│       ├── layout.tsx              # Layout con sidebar
│       ├── page.tsx                # Panel principal
│       ├── appointments/page.tsx   # Agenda de turnos
│       ├── telemedicine/page.tsx   # Videollamadas
│       ├── medical-records/
│       │   ├── page.tsx            # Lista de historiales
│       │   ├── new/page.tsx        # Crear historial
│       │   └── [id]/page.tsx       # Historial del paciente
│       ├── billing/page.tsx        # Facturación
│       └── schedule/page.tsx       # Horario del doctor
├── components/
│   ├── layout/dashboard-layout.tsx # Sidebar responsive
│   ├── appointments/               # Componentes de turnos
│   ├── billing/                    # Componentes de facturación
│   ├── medical-records/            # Componentes de historiales
│   ├── telemedicine/               # Componentes de videollamada
│   └── calendar/                   # Calendario interactivo
├── lib/
│   ├── api.ts                      # Cliente HTTP (Axios)
│   ├── billing.ts                  # API de facturación
│   ├── appointments.ts             # API de turnos
│   ├── medical-records.ts          # API de historiales
│   ├── telemedicine.ts             # API de telemedicina
│   └── utils.ts                    # Utilidades (formatCurrency, etc.)
├── stores/
│   └── auth.store.ts               # Estado de autenticación (Zustand)
└── hooks/
    └── use-auth.tsx                # Hook de protección de rutas
```

---

## Estructura de Carpetas del Backend

```
apps/api/src/
├── index.ts                        # Punto de entrada
├── server.ts                       # Configuración de Fastify
├── config/
│   └── env.ts                      # Variables de entorno (Zod)
├── middleware/
│   └── auth.ts                     # Middleware de autenticación y RBAC
└── modules/
    ├── auth/
    │   ├── auth.routes.ts          # Login, registro, refresh, logout
    │   ├── twofa.routes.ts         # Configurar, verificar y usar 2FA
    │   └── permissions.ts          # Roles y permisos (CASL)
    ├── users/
    │   └── users.routes.ts         # CRUD de usuarios
    ├── appointments/
    │   ├── appointments.routes.ts  # CRUD de turnos
    │   └── schedule.routes.ts      # Horarios de doctores
    ├── medical-records/
    │   └── medical-records.routes.ts # CRUD de historiales
    ├── billing/
    │   └── billing.routes.ts       # Facturas, pagos, Stripe
    └── telemedicine/
        └── telemedicine.routes.ts  # Salas de video, tokens Twilio
```

---

## Endpoints de la API

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Renovar token de acceso |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |
| POST | `/api/auth/2fa/setup` | Configurar 2FA |
| POST | `/api/auth/2fa/verify` | Verificar código 2FA |
| POST | `/api/auth/2fa/login` | Login con 2FA |

### Turnos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/appointments` | Listar turnos |
| GET | `/api/appointments/:id` | Obtener turno |
| POST | `/api/appointments` | Crear turno |
| PATCH | `/api/appointments/:id` | Actualizar turno |
| POST | `/api/appointments/:id/cancel` | Cancelar turno |
| GET | `/api/appointments/slots` | Ver horarios disponibles |

### Horarios
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/schedule/my` | Mi horario (doctor) |
| POST | `/api/schedule` | Crear horario |
| PATCH | `/api/schedule/:id` | Actualizar horario |
| DELETE | `/api/schedule/:id` | Eliminar horario |

### Historiales Médicos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/medical-records` | Listar historiales |
| GET | `/api/medical-records/:id` | Obtener historial |
| POST | `/api/medical-records` | Crear historial |
| PATCH | `/api/medical-records/:id` | Actualizar historial |
| DELETE | `/api/medical-records/:id` | Eliminar historial |
| GET | `/api/medical-records/patient/:id/history` | Historial del paciente |
| GET | `/api/medical-records/patient/:id/summary` | Resumen del paciente |

### Facturación
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/billing/invoices` | Listar facturas |
| GET | `/api/billing/invoices/:id` | Obtener factura |
| POST | `/api/billing/invoices` | Crear factura |
| PATCH | `/api/billing/invoices/:id` | Actualizar factura |
| POST | `/api/billing/payments` | Registrar pago |
| GET | `/api/billing/payments` | Listar pagos |
| GET | `/api/billing/stats` | Estadísticas de facturación |
| POST | `/api/billing/checkout/:invoiceId` | Crear sesión de pago Stripe |
| POST | `/api/billing/webhook` | Webhook de Stripe |

### Telemedicina
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/telemedicine/rooms` | Crear sala de video |
| GET | `/api/telemedicine/rooms/:roomSid/token` | Obtener token de acceso |
| POST | `/api/telemedicine/rooms/:roomSid/end` | Finalizar sala |
| GET | `/api/telemedicine/rooms/:roomSid/participants` | Ver participantes |
| GET | `/api/telemedicine/rooms/active` | Salas activas |
| POST | `/api/telemedicine/webhook` | Webhook de Twilio |

### Usuarios
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Listar usuarios (admin) |
| GET | `/api/users/:id` | Obtener usuario |
| PATCH | `/api/patients/profile` | Actualizar perfil paciente |
| PATCH | `/api/doctors/profile` | Actualizar perfil doctor |
| GET | `/api/doctors` | Listar doctores |

---

## Diseño y Responsive

Toda la interfaz está diseñada con **Tailwind CSS** y es completamente responsive:

- **Mobile** (< 640px): Menú hamburguesa, layouts apilados, botones a ancho completo
- **Tablet** (640px - 1024px): Grids de 2 columnas, sidebar colapsable
- **Desktop** (> 1024px): Sidebar fijo, grids de 3-4 columnas, layouts expandidos

### Paleta de colores
- **Principal**: Azul (#2563EB) a Cyan (#06B6D4) en degradado
- **Acento**: Gris oscuro (#111827) para botones principales
- **Estados**: Verde (pagado/completado), Amarillo (pendiente), Rojo (cancelado/vencido), Azul (confirmado), Púrpura (en progreso)

---

## Seguridad

- **Contraseñas**: Hasheadas con bcrypt (12 rounds)
- **Tokens JWT**: Acceso de corta duración + refresh tokens
- **2FA**: Códigos TOTP con speakeasy (compatible con cualquier app de autenticación)
- **RBAC**: Control de acceso basado en roles con CASL
- **Rate limiting**: Protección contra abuso de endpoints
- **CORS**: Configurado para permitir solo el dominio del frontend
- **Validación**: Todos los inputs validados con Zod tanto en frontend como en backend

---

## Despliegue en Producción

### Variables de entorno obligatorias
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="un-secreto-muy-largo-y-seguro"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_API_KEY="SK..."
TWILIO_API_SECRET="..."
CORS_ORIGIN="https://tu-dominio.com"
```

### Build de producción
```bash
pnpm build
```

### Iniciar en producción
```bash
# Frontend
cd apps/web && pnpm start

# Backend
cd apps/api && pnpm start
```

---

## Créditos y Tecnologías

Desarrollado con las siguientes tecnologías de código abierto:

- [Next.js](https://nextjs.org/) — Framework de React
- [Fastify](https://fastify.dev/) — Servidor HTTP de alto rendimiento
- [Prisma](https://www.prisma.io/) — ORM para bases de datos
- [Tailwind CSS](https://tailwindcss.com/) — Framework de estilos
- [Zustand](https://github.com/pmndrs/zustand) — Estado global
- [Stripe](https://stripe.com/) — Pagos online
- [Twilio](https://www.twilio.com/) — Videollamadas
- [CASL](https://casl.js.org/) — Control de acceso
- [Zod](https://zod.dev/) — Validación de esquemas

---

## Licencia

© 2026 VKY.SaaS — Todos los derechos reservados.

---

<div align="center">

**Desarrollado por [Es-Web Desarrollo de Software](https://es-web.com)**

*Soluciones digitales para profesionales de la salud*

</div>
