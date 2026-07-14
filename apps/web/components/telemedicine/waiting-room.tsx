'use client';

import { useState, useEffect } from 'react';
import { telemedicineApi } from '@/lib/telemedicine';

interface WaitingRoomProps {
  appointmentId: string;
  roomName: string;
  isDoctor: boolean;
  onJoin: (token: string, roomSid: string) => void;
  onLeave: () => void;
}

export function WaitingRoom({
  appointmentId,
  roomName,
  isDoctor,
  onJoin,
  onLeave,
}: WaitingRoomProps) {
  const [status, setStatus] = useState<'waiting' | 'creating' | 'ready' | 'error'>('waiting');
  const [error, setError] = useState('');
  const [roomInfo, setRoomInfo] = useState<any>(null);

  useEffect(() => {
    initRoom();
  }, []);

  const initRoom = async () => {
    setStatus('creating');
    try {
      // Create room
      const { data: roomData } = await telemedicineApi.createRoom(appointmentId);
      setRoomInfo(roomData.data);

      // Get token
      await telemedicineApi.getToken(roomData.data.roomSid);
      
      setStatus('ready');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la sala');
      setStatus('error');
    }
  };

  const handleJoin = async () => {
    try {
      const { data } = await telemedicineApi.getToken(roomInfo.roomSid);
      onJoin(data.data.token, data.data.roomSid);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al unirse a la sala');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        {status === 'creating' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Preparando sala de video...
            </h2>
            <p className="text-gray-500">Por favor espera</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={onLeave}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Volver
            </button>
          </div>
        )}

        {status === 'ready' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📹</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sala lista
            </h2>
            <p className="text-gray-500 mb-2">{roomName}</p>
            
            {isDoctor ? (
              <p className="text-sm text-gray-400 mb-6">
                La sala está lista. Puedes entrar cuando quieras.
              </p>
            ) : (
              <p className="text-sm text-gray-400 mb-6">
                El doctor te esperará en la sala de consulta.
              </p>
            )}

            {/* Camera preview */}
            <div className="bg-gray-200 rounded-lg h-48 mb-6 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <span className="text-4xl">🎥</span>
                <p className="mt-2 text-sm">Vista previa de cámara</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={onLeave}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Salir
              </button>
              <button
                onClick={handleJoin}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                {isDoctor ? 'Iniciar Consulta' : 'Unirse a Consulta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
