'use client';

import { useState, useEffect } from 'react';
import { scheduleApi, DoctorSchedule } from '@/lib/appointments';
import { useAuthStore } from '@/stores/auth.store';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export default function SchedulePage() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true });

  useEffect(() => { loadSchedules(); }, []);

  const loadSchedules = async () => {
    try { const { data } = await scheduleApi.getMySchedule(); setSchedules(data.data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await scheduleApi.update(editingId, formData);
      else await scheduleApi.create(formData);
      setEditingId(null);
      setFormData({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true });
      loadSchedules();
    } catch (e: any) { alert(e.response?.data?.error || 'Error al guardar'); }
  };

  const handleEdit = (s: DoctorSchedule) => { setEditingId(s.id); setFormData({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive }); };
  const handleDelete = async (id: string) => { if (confirm('¿Eliminar este horario?')) { try { await scheduleApi.delete(id); loadSchedules(); } catch (e) { console.error(e); } } };
  const handleToggleActive = async (s: DoctorSchedule) => { try { await scheduleApi.update(s.id, { isActive: !s.isActive }); loadSchedules(); } catch (e) { console.error(e); } };

  if (user?.role !== 'DOCTOR') {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-lg mx-auto mt-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso restringido</h2>
          <p className="text-gray-500">Solo los doctores pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  const activeCount = schedules.filter((s) => s.isActive).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi Horario</h1>
        <p className="text-gray-500 mt-1">Configura tu disponibilidad semanal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Editar Horario' : 'Agregar Horario'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Día de la semana</label>
              <select value={formData.dayOfWeek} onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {DAYS_OF_WEEK.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora inicio</label>
                <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora fin</label>
                <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
              <label htmlFor="isActive" className="text-sm text-gray-700">Activo</label>
            </div>
            <div className="flex space-x-3">
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true }); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm">
                  Cancelar
                </button>
              )}
              <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-sm font-medium">
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de horarios */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mi Horario Semanal</h2>
            <span className="text-xs font-medium text-gray-500">{activeCount}/7 días activos</span>
          </div>
          {loading ? (
            <p className="text-gray-500 text-sm">Cargando...</p>
          ) : (
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day) => {
                const schedule = schedules.find((s) => s.dayOfWeek === day.value);
                return (
                  <div key={day.value} className={`flex items-center justify-between p-4 rounded-xl border transition ${schedule?.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div className="flex items-center space-x-4">
                      <input type="checkbox" checked={schedule?.isActive || false} onChange={() => schedule && handleToggleActive(schedule)} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{day.label}</p>
                        {schedule ? (
                          <p className="text-xs text-gray-500">{schedule.startTime} — {schedule.endTime}</p>
                        ) : (
                          <p className="text-xs text-gray-400">No disponible</p>
                        )}
                      </div>
                    </div>
                    {schedule && (
                      <div className="flex space-x-1">
                        <button onClick={() => handleEdit(schedule)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        </button>
                        <button onClick={() => handleDelete(schedule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
