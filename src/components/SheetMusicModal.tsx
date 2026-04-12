'use client';

import { useRef } from 'react';
import type { SheetPart, BandMember } from '@/types';

const INSTRUMENT_ZH: Record<string, string> = {
  drums: '鼓',
  bass: '贝斯',
  vocals: '主唱',
  guitar: '吉他',
  keys: '键盘',
};

interface SheetMusicModalProps {
  sheetParts: SheetPart[];
  members: BandMember[];
  onClose: () => void;
}

export default function SheetMusicModal({ sheetParts, members, onClose }: SheetMusicModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const getMember = (characterId: string) =>
    members.find((m) => m.id === characterId);

  const handleExportPDF = () => {
    if (!contentRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('请允许弹出窗口以导出 PDF');
      return;
    }

    const styleEl = printWindow.document.createElement('style');
    styleEl.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
        background: #fff;
        color: #111;
        padding: 24px;
      }
      .sheet-title {
        font-size: 24px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 24px;
        color: #111;
      }
      .part-section {
        margin-bottom: 28px;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 16px;
        page-break-inside: avoid;
      }
      .part-header {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 10px;
        padding-bottom: 6px;
        border-bottom: 2px solid #333;
      }
      .meta-row {
        display: flex;
        gap: 24px;
        margin-bottom: 12px;
        font-size: 13px;
        color: #444;
      }
      .meta-item { display: flex; gap: 4px; }
      .meta-label { font-weight: 600; color: #222; }
      .chord-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 12px;
      }
      .chord-box {
        border: 1px solid #666;
        border-radius: 4px;
        padding: 8px 4px;
        text-align: center;
        font-weight: 600;
        font-size: 14px;
        background: #f9f9f9;
      }
      .section-label {
        font-size: 12px;
        font-weight: 600;
        color: #555;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .description-text {
        font-size: 13px;
        line-height: 1.6;
        color: #333;
        margin-bottom: 10px;
      }
      @media print {
        body { padding: 16px; }
        .part-section { page-break-inside: avoid; }
      }
    `;

    printWindow.document.head.appendChild(styleEl);

    const titleEl = printWindow.document.createElement('h1');
    titleEl.className = 'sheet-title';
    titleEl.textContent = '赛博乐队演奏谱';
    printWindow.document.body.appendChild(titleEl);

    const clone = contentRef.current.cloneNode(true) as HTMLElement;
    printWindow.document.body.appendChild(clone);

    printWindow.document.title = '赛博乐队演奏谱';

    // Small delay to ensure styles are applied
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        style={{ color: '#111' }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">赛博乐队演奏谱</h2>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
            >
              导出 PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
            >
              关闭
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6" ref={contentRef}>
          {sheetParts.map((part) => {
            const member = getMember(part.characterId);
            const instrumentZh = INSTRUMENT_ZH[part.instrument] ?? part.instrument;
            const accentColor = member?.color ?? '#6366f1';

            return (
              <div
                key={part.characterId}
                className="part-section mb-6 border rounded-xl p-5 last:mb-0"
                style={{ borderColor: `${accentColor}55`, background: '#fafafa' }}
              >
                {/* Part header */}
                <div
                  className="part-header flex items-center gap-2 mb-3 pb-3"
                  style={{ borderBottom: `2px solid ${accentColor}` }}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: accentColor }}
                  />
                  <span className="text-base font-bold text-gray-900">
                    {member?.name ?? part.characterId}
                  </span>
                  <span className="text-sm text-gray-500">—</span>
                  <span className="text-sm font-semibold text-gray-600">{instrumentZh}</span>
                </div>

                {/* Metadata row */}
                <div className="meta-row flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <span>
                    <span className="font-semibold text-gray-800">调：</span>
                    {part.key}
                  </span>
                  <span>
                    <span className="font-semibold text-gray-800">BPM：</span>
                    {part.bpm}
                  </span>
                  <span>
                    <span className="font-semibold text-gray-800">拍号：</span>
                    {part.timeSignature}
                  </span>
                  <span>
                    <span className="font-semibold text-gray-800">小节：</span>
                    {part.barCount}
                  </span>
                </div>

                {/* Chord grid */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    和弦进行
                  </p>
                  <div className="chord-grid grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {part.chords.map((chord, i) => (
                      <div
                        key={i}
                        className="chord-box border rounded-lg py-2 text-center font-bold text-sm"
                        style={{
                          borderColor: `${accentColor}88`,
                          background: `${accentColor}11`,
                          color: '#1a1a2e',
                        }}
                      >
                        <span className="text-xs text-gray-400 block leading-none">{i + 1}</span>
                        {chord}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rhythm description */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    节奏型
                  </p>
                  <p className="description-text text-sm text-gray-700 leading-relaxed">
                    {part.rhythmDescription}
                  </p>
                </div>

                {/* Playing tips */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    演奏技巧
                  </p>
                  <p className="description-text text-sm text-gray-700 leading-relaxed">
                    {part.playingTips}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
