'use client';

import { useEffect, useRef, useState } from 'react';
import StageCanvas from '@/components/StageCanvas';
import PerformBar from '@/components/PerformBar';
import ChatPanel from '@/components/ChatPanel';
import { PRESET_CHARACTERS } from '@/data/characters';
import { buildCharacterPrompt, buildGroupPrompt } from '@/ai/prompts';
import type { BandMember, ChatMessage, ChatMode, EnergyLevels } from '@/types';

const ZERO_ENERGY: EnergyLevels = { low: 0, mid: 0, high: 0, overall: 0 };

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Convert ChatMessage array to Gemini history format (last N messages, excluding system)
function toHistory(messages: ChatMessage[], limit = 10) {
  const filtered = messages
    .filter((m) => m.characterId !== 'system')
    .slice(-limit);

  return filtered.map((m) => ({
    role: m.characterId === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.text }],
  }));
}

export default function Home() {
  const members: BandMember[] = PRESET_CHARACTERS;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMode, setChatMode] = useState<ChatMode>('group');
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPerformed, setHasPerformed] = useState(false);
  const [energy] = useState<EnergyLevels>(ZERO_ENERGY);

  // Track if welcome message was sent
  const welcomeSent = useRef(false);

  // NOVA sends welcome message on mount
  useEffect(() => {
    if (welcomeSent.current) return;
    welcomeSent.current = true;

    const nova = members.find((m) => m.id === 'nova');
    if (!nova) return;

    setMessages([
      {
        id: uid(),
        characterId: 'nova',
        text: '嘿！欢迎来到我们的赛博乐队！今天想玩点什么风格？让我们燥起来！',
        timestamp: Date.now(),
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCharacterClick = (characterId: string) => {
    setActiveCharacterId(characterId);
    setChatMode('private');
  };

  const handleModeChange = (mode: ChatMode) => {
    setChatMode(mode);
    if (mode === 'group') {
      setActiveCharacterId(null);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (isLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: uid(),
      characterId: 'user',
      text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      let systemPrompt: string;

      if (chatMode === 'private' && activeCharacterId) {
        const member = members.find((m) => m.id === activeCharacterId);
        if (!member) throw new Error('Character not found');
        systemPrompt = buildCharacterPrompt(member);
      } else {
        systemPrompt = buildGroupPrompt(members);
      }

      const history = toHistory(messages, 10);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, history, userMessage: text }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const responseText: string = data.text ?? '';

      if (chatMode === 'private' && activeCharacterId) {
        // Single character reply
        const replyMsg: ChatMessage = {
          id: uid(),
          characterId: activeCharacterId,
          text: responseText.trim(),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, replyMsg]);
      } else {
        // Group mode: parse [NAME]: text lines
        const lines = responseText.split('\n').filter((l) => l.trim());
        const parsed: ChatMessage[] = [];

        for (const line of lines) {
          const match = line.match(/^\[([^\]]+)\]:\s*(.+)/);
          if (match) {
            const name = match[1].trim().toUpperCase();
            const msgText = match[2].trim();
            const member = members.find((m) => m.name.toUpperCase() === name);
            if (member) {
              parsed.push({
                id: uid(),
                characterId: member.id,
                text: msgText,
                timestamp: Date.now(),
              });
            }
          }
        }

        // Fallback: if parsing fails, use NOVA
        if (parsed.length === 0 && responseText.trim()) {
          const nova = members.find((m) => m.id === 'nova');
          parsed.push({
            id: uid(),
            characterId: nova?.id ?? members[0].id,
            text: responseText.trim(),
            timestamp: Date.now(),
          });
        }

        setMessages((prev) => [...prev, ...parsed]);
      }
    } catch (err) {
      console.error('[handleSendMessage]', err);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          characterId: 'system',
          text: '网络有点问题，稍后再试吧...',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartShow = () => {
    setIsPlaying(true);
    setHasPerformed(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleExportSheet = () => {
    alert('谱子导出功能即将上线！');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--stage-bg,#0a0a14)]">
      {/* Stage: top 65vh */}
      <div className="w-full shrink-0" style={{ height: '65vh' }}>
        <StageCanvas
          members={members}
          isPlaying={isPlaying}
          energy={energy}
          onCharacterClick={handleCharacterClick}
        />
      </div>

      {/* Perform bar */}
      <div className="shrink-0">
        <PerformBar
          isPlaying={isPlaying}
          isLoading={false}
          onStartShow={handleStartShow}
          onStop={handleStop}
          onExportSheet={handleExportSheet}
          hasPerformed={hasPerformed}
        />
      </div>

      {/* Chat panel: bottom 35vh */}
      <div className="w-full shrink-0 overflow-hidden" style={{ height: 'calc(35vh - 48px)' }}>
        <ChatPanel
          messages={messages}
          members={members}
          activeCharacterId={activeCharacterId}
          chatMode={chatMode}
          onSendMessage={handleSendMessage}
          onModeChange={handleModeChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
