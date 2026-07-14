'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoCallProps {
  token: string;
  roomName: string;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function VideoCall({ token, roomName, onDisconnect, onError }: VideoCallProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const roomRef = useRef<any>(null);

  useEffect(() => {
    if (!token || !roomName) return;

    initRoom();

    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [token, roomName]);

  const initRoom = async () => {
    try {
      // Importación dinámica de Twilio Video
      const Video = (await import('twilio-video')).default;

      const room = await Video.connect(token, {
        name: roomName,
        audio: true,
        video: { width: 640 },
      });

      roomRef.current = room;

      // La sala ya está conectada cuando Video.connect() resuelve
      console.log('Conectado a la sala');
      setIsConnected(true);
      setParticipants(Array.from(room.participants.values()));

      // Manejar participante conectado
      (room as any).on('participantConnected', (participant: any) => {
        console.log('Participante conectado:', participant.identity);
        setParticipants((prev) => [...prev, participant]);
      });

      // Manejar participante desconectado
      (room as any).on('participantDisconnected', (participant: any) => {
        console.log('Participante desconectado:', participant.identity);
        setParticipants((prev) => prev.filter((p: any) => p.sid !== participant.sid));
      });

      // Manejar desconexión
      (room as any).on('disconnected', () => {
        console.log('Desconectado de la sala');
        setIsConnected(false);
        setParticipants([]);
        onDisconnect?.();
      });

      // Manejar errores
      (room as any).on('error', (error: any) => {
        console.error('Error en la sala:', error);
        onError?.(error);
      });

      // Adjuntar video del participante local
      const localParticipant = room.localParticipant;
      const videoTrack = localParticipant.videoTracks.values().next().value;
      
      if (videoTrack && videoRef.current) {
        const videoElement = videoTrack.track.attach();
        videoElement.className = 'rounded-lg';
        videoRef.current.appendChild(videoElement);
      }

    } catch (error: any) {
      console.error('Error al conectar a la sala:', error);
      onError?.(error);
    }
  };

  const toggleMute = () => {
    if (!roomRef.current) return;
    
    const localParticipant = roomRef.current.localParticipant;
    localParticipant.audioTracks.forEach((track: any) => {
      if (isMuted) {
        track.track.enable();
      } else {
        track.track.disable();
      }
    });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (!roomRef.current) return;
    
    const localParticipant = roomRef.current.localParticipant;
    localParticipant.videoTracks.forEach((track: any) => {
      if (isVideoOff) {
        track.track.enable();
      } else {
        track.track.disable();
      }
    });
    setIsVideoOff(!isVideoOff);
  };

  const leaveRoom = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Encabezado */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-white font-medium">{roomName}</span>
        </div>
        <div className="text-gray-400 text-sm">
          {participants.length + 1} participante(s)
        </div>
      </div>

      {/* Área de video */}
      <div className="flex-1 relative">
        {/* Participantes remotos */}
        {participants.map((participant) => (
          <ParticipantTrack key={participant.sid} participant={participant} />
        ))}

        {/* Video local (superposición pequeña) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
          <div ref={videoRef} className="w-full h-full" />
        </div>

        {/* Estado de conexión */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p className="text-white">Conectando a la sala...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="bg-gray-800 px-4 py-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isMuted ? 'Activar micrófono' : 'Silenciar'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isVideoOff ? 'Activar cámara' : 'Apagar cámara'}
          >
            {isVideoOff ? '📷' : '📹'}
          </button>

          <button
            onClick={leaveRoom}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition"
            title="Salir de la sala"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de pista del participante
function ParticipantTrack({ participant }: { participant: any }) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    if (!participant) return;

    const handleTrackSubscribed = (track: any) => {
      if (track.track && videoRef.current) {
        const element = track.track.attach();
        element.className = 'w-full h-full object-cover rounded-lg';
        videoRef.current.appendChild(element);

        if (track.kind === 'video') setHasVideo(true);
        if (track.kind === 'audio') setHasAudio(true);
      }
    };

    const handleTrackUnsubscribed = (track: any) => {
      const elements = track.track.detach();
      elements.forEach((element: any) => element.remove());

      if (track.kind === 'video') setHasVideo(false);
      if (track.kind === 'audio') setHasAudio(false);
    };

    participant.on('trackSubscribed', handleTrackSubscribed);
    participant.on('trackUnsubscribed', handleTrackUnsubscribed);

    // Adjuntar pistas existentes
    participant.videoTracks.forEach((publication: any) => {
      if (publication.track) {
        handleTrackSubscribed({ track: publication.track, kind: 'video' });
      }
    });

    return () => {
      participant.off('trackSubscribed', handleTrackSubscribed);
      participant.off('trackUnsubscribed', handleTrackUnsubscribed);
    };
  }, [participant]);

  return (
    <div className="absolute inset-0">
      <div ref={videoRef} className="w-full h-full" />
      
      {/* Información del participante */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm font-medium">{participant.identity}</span>
          {!hasAudio && <span className="text-red-400">🔇</span>}
          {!hasVideo && <span className="text-red-400">📷</span>}
        </div>
      </div>
    </div>
  );
}
