'use client';


import { MedicalRecord } from '@/lib/medical-records';
import { formatDateTime } from '@/lib/utils';

interface MedicalRecordCardProps {
  record: MedicalRecord;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  showPatient?: boolean;
  showDoctor?: boolean;
}

export function MedicalRecordCard({
  record,
  onView,
  onEdit,
  showPatient = false,
  showDoctor = true,
}: MedicalRecordCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Fecha y doctor */}
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="mr-2">📅</span>
            <span>{formatDateTime(record.createdAt)}</span>
            {record.appointment && (
              <>
                <span className="mx-2">•</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {record.appointment.type === 'TELEMEDICINE' ? '📹 Telemedicina' : '🏥 Presencial'}
                </span>
              </>
            )}
          </div>

          {/* Paciente */}
          {showPatient && record.patient && (
            <p className="text-sm text-gray-600 mb-1">
              👤 {record.patient.firstName} {record.patient.lastName}
            </p>
          )}

          {/* Doctor */}
          {showDoctor && record.doctor && (
            <p className="text-sm text-gray-600 mb-1">
              🩺 Dr. {record.doctor.firstName} {record.doctor.lastName}
              {record.doctor.specialty && (
                <span className="text-gray-400"> — {record.doctor.specialty}</span>
              )}
            </p>
          )}

          {/* Diagnóstico */}
          <h4 className="font-medium text-gray-900 mt-2">{record.diagnosis}</h4>

          {/* Síntomas */}
          {record.symptoms && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              <span className="font-medium">Síntomas:</span> {record.symptoms}
            </p>
          )}

          {/* Tratamiento */}
          {record.treatment && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              <span className="font-medium">Tratamiento:</span> {record.treatment}
            </p>
          )}

          {/* Indicador de receta */}
          {record.prescription && (
            <div className="mt-2 flex items-center text-sm text-primary-600">
              <span className="mr-1">💊</span>
              Tiene receta médica
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-4 flex space-x-2">
        {onView && (
          <button
            onClick={() => onView(record.id)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Ver detalle
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(record.id)}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
