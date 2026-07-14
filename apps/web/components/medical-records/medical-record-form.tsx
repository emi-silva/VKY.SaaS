'use client';

import { useState } from 'react';


interface MedicalRecordFormProps {
  appointmentId?: string;
  patientId?: string;
  initialData?: {
    diagnosis?: string;
    symptoms?: string;
    treatment?: string;
    prescription?: string;
    notes?: string;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export function MedicalRecordForm({
  appointmentId,
  patientId: _patientId,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
}: MedicalRecordFormProps) {
  const [formData, setFormData] = useState({
    diagnosis: initialData?.diagnosis || '',
    symptoms: initialData?.symptoms || '',
    treatment: initialData?.treatment || '',
    prescription: initialData?.prescription || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'El diagnóstico es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      appointmentId,
      ...formData,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {mode === 'create' ? 'Nuevo Historial Médico' : 'Editar Historial Médico'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Diagnóstico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnóstico *
          </label>
          <input
            type="text"
            value={formData.diagnosis}
            onChange={(e) => handleChange('diagnosis', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.diagnosis ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Gripe común, Hipertensión arterial..."
          />
          {errors.diagnosis && (
            <p className="mt-1 text-sm text-red-500">{errors.diagnosis}</p>
          )}
        </div>

        {/* Síntomas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Síntomas
          </label>
          <textarea
            value={formData.symptoms}
            onChange={(e) => handleChange('symptoms', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe los síntomas del paciente..."
          />
        </div>

        {/* Tratamiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tratamiento
          </label>
          <textarea
            value={formData.treatment}
            onChange={(e) => handleChange('treatment', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe el tratamiento indicado..."
          />
        </div>

        {/* Receta médica */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            💊 Receta Médica
          </label>
          <textarea
            value={formData.prescription}
            onChange={(e) => handleChange('prescription', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            placeholder="Medicamento - Dosis - Frecuencia - Duración&#10;Ej:&#10;Paracetamol 500mg - 1 tableta cada 8 horas - 5 días&#10;Ibuprofeno 400mg - 1 tableta cada 12 horas - 3 días"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas adicionales
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Notas privadas, seguimiento, etc."
          />
        </div>

        {/* Acciones */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear Historial' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
