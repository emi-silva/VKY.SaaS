'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';

interface Message {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  roomSid: string;
  participants: Array<{ identity: string }>;
  onSendMessage?: (message: string) => void;
}

export function ChatPanel({ roomSid: _roomSid, participants, onSendMessage }: ChatPanelProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: user?.id || 'unknown',
      senderName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario',
      content: newMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    onSendMessage?.(newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-medium text-gray-900">Chat</h3>
        <p className="text-xs text-gray-500">
          {participants.length} participante(s) en la sala
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <span className="text-3xl">💬</span>
            <p className="mt-2 text-sm">No hay mensajes aún</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === user?.id ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg ${
                  msg.sender === user?.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.sender !== user?.id && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {msg.senderName}
                  </p>
                )}
                <p className="text-sm">{msg.content}</p>
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {msg.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
