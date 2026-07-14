'use client';

import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const QUICK_ACTIONS = [
  {
    label: 'Nueva Cita',
    href: '/dashboard/appointments',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Telemedicina',
    href: '/dashboard/telemedicine',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: 'bg-purple-50 text-purple-600',
  },
  {
    label: 'Historial',
    href: '/dashboard/medical-records',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: 'bg-green-50 text-green-600',
  },
  {
    label: 'Facturación',
    href: '/dashboard/billing',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    color: 'bg-amber-50 text-amber-600',
  },
];

const STATS = [
  { label: 'Citas hoy', value: '0', change: '+0%', up: true, color: 'text-blue-600' },
  { label: 'Pacientes', value: '0', change: '+0%', up: true, color: 'text-green-600' },
  { label: 'Ingresos mes', value: '$0', change: '+0%', up: true, color: 'text-amber-600' },
  { label: 'Consultas', value: '0', change: '+0%', up: true, color: 'text-purple-600' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Buenos días');
    else if (h < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  const getFirstName = () => user?.firstName || 'Usuario';
  const getRoleLabel = () => {
    const labels: Record<string, string> = { ADMIN: 'Administrador', DOCTOR: 'Doctor', PATIENT: 'Paciente', RECEPTIONIST: 'Recepcionista' };
    return labels[user?.role || ''] || user?.role;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {getFirstName()}
        </h1>
        <p className="text-gray-500 mt-1">{getRoleLabel()} — Panel de control</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <span className="text-xs font-medium text-green-600">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acciones rápidas */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center space-y-3 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>

          {/* Actividad reciente */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad reciente</h3>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No hay actividad reciente</p>
              <p className="text-gray-400 text-xs mt-1">Las acciones aparecerán aquí</p>
            </div>
          </div>
        </div>

        {/* Barra lateral derecha */}
        <div className="space-y-6">
          {/* Próximas citas */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Próximas citas</h3>
              <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Sin citas programadas</p>
            </div>
          </div>

          {/* Tarjeta de perfil */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                <span className="text-lg font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{getRoleLabel()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
