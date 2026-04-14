'use client';

import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  time: number;
}

interface Props {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatBubbles({ messages, isLoading }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'system' ? (
            <div className="text-xs text-white/40 text-center w-full py-1">
              {msg.text}
            </div>
          ) : (
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm backdrop-blur-md ${
                msg.role === 'user'
                  ? 'bg-[var(--simone-accent)] text-white rounded-br-sm'
                  : 'bg-white/15 text-white rounded-bl-sm'
              }`}
            >
              {msg.role === 'ai' && (
                <div className="text-[10px] text-white/50 mb-1 font-medium">Simone</div>
              )}
              {msg.text}
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white/15 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm backdrop-blur-md">
            <div className="text-[10px] text-white/50 mb-1 font-medium">Simone</div>
            <span className="text-white/60 animate-pulse">想想看...</span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
