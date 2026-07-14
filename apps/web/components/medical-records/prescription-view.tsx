'use client';

import { MedicalRecord } from '@/lib/medical-records';
import { formatDateTime } from '@/lib/utils';

interface PrescriptionViewProps {
  record: MedicalRecord;
  onClose?: () => void;
  onPrint?: () => void;
}

export function PrescriptionView({ record, onClose, onPrint }: PrescriptionViewProps) {
  if (!record.prescription) {
    return (
      <div className="text-center py-8 text-gray-500">
        Esta consulta no tiene receta médica
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Encabezado */}
      <div className="bg-primary-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Receta Médica</h2>
            <p className="text-primary-100 text-sm">VKY.SaaS Medical Center</p>
          </div>
          <div className="text-right text-sm">
            <p>{formatDateTime(record.createdAt)}</p>
            <p className="text-primary-100">Folio: {record.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Doctor y paciente */}
        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Médico</h4>
            <p className="font-medium text-gray-900">
              Dr. {record.doctor?.firstName} {record.doctor?.lastName}
            </p>
            <p className="text-sm text-gray-600">{record.doctor?.specialty}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Paciente</h4>
            <p className="font-medium text-gray-900">
              {record.patient?.firstName} {record.patient?.lastName}
            </p>
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Diagnóstico</h4>
          <p className="text-gray-900">{record.diagnosis}</p>
        </div>

        {/* Receta */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">💊 Prescripción</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900">
              {record.prescription}
            </pre>
          </div>
        </div>

        {/* Tratamiento */}
        {record.treatment && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Indicaciones</h4>
            <p className="text-sm text-gray-700">{record.treatment}</p>
          </div>
        )}

        {/* Notas */}
        {record.notes && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Notas</h4>
            <p className="text-sm text-gray-600 italic">{record.notes}</p>
          </div>
        )}

        {/* Firma */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-end">
            <div className="text-center">
              <div className="w-48 border-b border-gray-900 mb-2" />
              <p className="text-sm font-medium text-gray-900">
                Dr. {record.doctor?.firstName} {record.doctor?.lastName}
              </p>
              <p className="text-xs text-gray-500">{record.doctor?.specialty}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
        {onPrint && (
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            🖨️ Imprimir
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
