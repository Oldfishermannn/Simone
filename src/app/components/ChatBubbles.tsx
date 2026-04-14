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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
      {messages.map((msg, i) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          {msg.role === 'system' ? (
            <div className="text-[11px] text-white/30 text-center w-full py-2 italic"
                 style={{ fontFamily: 'var(--font-body)' }}>
              {msg.text}
            </div>
          ) : msg.role === 'ai' ? (
            <div className="max-w-[82%] flex gap-3 items-start">
              {/* Simone avatar */}
              <div className="shrink-0 w-7 h-7 rounded-full mt-0.5 flex items-center justify-center text-[11px]"
                   style={{
                     background: 'linear-gradient(135deg, var(--simone-accent), var(--simone-accent-warm))',
                     color: '#0d0d1a',
                     fontFamily: 'var(--font-display)',
                     fontWeight: 500,
                   }}>
                S
              </div>
              <div>
                <div className="text-[10px] text-white/35 mb-1.5 tracking-widest uppercase"
                     style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.1em' }}>
                  Simone
                </div>
                <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 text-[13.5px] leading-relaxed text-white/85">
                  {msg.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-[78%] rounded-2xl rounded-br-sm px-4 py-3 text-[13.5px] leading-relaxed"
                 style={{
                   background: 'linear-gradient(135deg, rgba(201, 160, 220, 0.25), rgba(232, 180, 184, 0.2))',
                   backdropFilter: 'blur(20px)',
                   WebkitBackdropFilter: 'blur(20px)',
                   border: '1px solid rgba(201, 160, 220, 0.15)',
                   color: 'rgba(255, 255, 255, 0.9)',
                 }}>
              {msg.text}
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start animate-fade-up">
          <div className="flex gap-3 items-start">
            <div className="shrink-0 w-7 h-7 rounded-full mt-0.5 flex items-center justify-center text-[11px]"
                 style={{
                   background: 'linear-gradient(135deg, var(--simone-accent), var(--simone-accent-warm))',
                   color: '#0d0d1a',
                   fontFamily: 'var(--font-display)',
                   fontWeight: 500,
                 }}>
              S
            </div>
            <div>
              <div className="text-[10px] text-white/35 mb-1.5 tracking-widest uppercase"
                   style={{ letterSpacing: '0.1em' }}>
                Simone
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
