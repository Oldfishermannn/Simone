'use client';

interface PerformBarProps {
  isPlaying: boolean;
  isLoading: boolean;
  onStartShow: () => void;
  onStop: () => void;
  onExportSheet: () => void;
  hasPerformed: boolean;
  isGeneratingSheet?: boolean;
}

export default function PerformBar({
  isPlaying,
  isLoading,
  onStartShow,
  onStop,
  onExportSheet,
  hasPerformed,
  isGeneratingSheet = false,
}: PerformBarProps) {
  return (
    <div className="flex flex-row items-center justify-center gap-4 px-4 py-3 bg-[#0d0d1a] border-t border-b border-[#222]">
      {isLoading ? (
        <button
          disabled
          className="px-6 py-2 text-sm font-semibold rounded-lg border border-[#444] text-[#666] bg-transparent cursor-not-allowed opacity-60"
        >
          ⏳ 准备中...
        </button>
      ) : isPlaying ? (
        <button
          onClick={onStop}
          className="px-6 py-2 text-sm font-semibold rounded-lg border border-[#666] text-[#aaa] bg-transparent hover:bg-[#1a1a2e] transition-colors cursor-pointer"
        >
          ⏹ 停止
        </button>
      ) : (
        <button
          onClick={onStartShow}
          className="px-6 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          style={{
            border: '1px solid #ff00ff',
            color: '#ff00ff',
            backgroundColor: 'rgba(255, 0, 255, 0.15)',
            textShadow: '0 0 8px #ff00ff, 0 0 16px #ff00ff',
          }}
        >
          ▶ 开始演出
        </button>
      )}

      {hasPerformed && !isPlaying && !isLoading && (
        <button
          onClick={onExportSheet}
          disabled={isGeneratingSheet}
          className="px-5 py-2 text-sm font-semibold rounded-lg border border-cyan-400 text-cyan-400 bg-transparent hover:bg-cyan-900/30 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGeneratingSheet ? '⏳ 生成中...' : '📄 导出谱子'}
        </button>
      )}
    </div>
  );
}
