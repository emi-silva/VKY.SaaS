'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VideoCall } from '@/components/telemedicine/video-call';
import { WaitingRoom } from '@/components/telemedicine/waiting-room';
import { ChatPanel } from '@/components/telemedicine/chat-panel';
import { useAuthStore } from '@/stores/auth.store';

export default function TelemedicinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const appointmentId = searchParams.get('appointmentId');
  const [phase, setPhase] = useState<'waiting' | 'call' | 'ended'>('waiting');
  const [token, setToken] = useState('');
  const [roomSid, setRoomSid] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [error, setError] = useState('');
  const isDoctor = user?.role === 'DOCTOR';

  if (!appointmentId) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-lg mx-auto mt-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No se especificó una cita</h2>
          <p className="text-gray-500 mb-6">Accede desde tu agenda de citas para iniciar una consulta</p>
          <button onClick={() => router.push('/dashboard/appointments')} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition text-sm">
            Ir a mis citas
          </button>
        </div>
      </div>
    );
  }

  const handleJoinCall = (joinToken: string, joinRoomSid: string) => { setToken(joinToken); setRoomSid(joinRoomSid); setPhase('call'); };
  const handleDisconnect = () => setPhase('ended');
  const handleLeave = () => router.push('/dashboard/appointments');

  return (
    <div className="h-full">
      {phase === 'waiting' && (
        <WaitingRoom appointmentId={appointmentId} roomName={`Cita ${appointmentId.slice(0, 8)}`} isDoctor={isDoctor} onJoin={handleJoinCall} onLeave={handleLeave} />
      )}
      {phase === 'call' && (
        <div className="h-full flex">
          <div className={`flex-1 p-4 ${showChat ? 'mr-80' : ''}`}>
            <VideoCall token={token} roomName={`Cita ${appointmentId.slice(0, 8)}`} onDisconnect={handleDisconnect} onError={(err) => setError(err.message)} />
          </div>
          {showChat && (
            <div className="fixed right-0 top-0 bottom-0 w-80 p-4">
              <ChatPanel roomSid={roomSid} participants={[]} />
            </div>
          )}
          <button onClick={() => setShowChat(!showChat)} className="fixed right-4 top-4 z-10 p-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition">
            {showChat ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
            )}
          </button>
        </div>
      )}
      {phase === 'ended' && (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Consulta finalizada</h2>
            <p className="text-gray-500 mb-6">La videollamada ha terminado correctamente</p>
            {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              {isDoctor && (
                <button onClick={() => router.push(`/dashboard/medical-records/new?appointmentId=${appointmentId}`)} className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-sm font-medium">
                  Crear Historial Médico
                </button>
              )}
              <button onClick={() => router.push('/dashboard/appointments')} className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
                Volver a mis citas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
