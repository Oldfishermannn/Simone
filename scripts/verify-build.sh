#!/usr/bin/env bash
# verify-build.sh — iOS Engineer 报 DONE 前必跑
# 用法：./scripts/verify-build.sh [--background]
# 作用：xcodebuild 编译 iPhone 15 Pro target，失败就拦住 DONE
# --background: 后台跑，日志写 /tmp/simone-build.log，立刻返回

set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$REPO/simone ios/Simone.xcodeproj"
LOG="/tmp/simone-build-$(date +%s).log"
BG_FLAG="${1:-}"

if [ ! -d "$PROJ" ]; then
  echo "❌ 找不到 $PROJ"
  exit 1
fi

CMD=(xcodebuild -project "$PROJ" -scheme Simone \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -configuration Debug build)

if [ "$BG_FLAG" = "--background" ]; then
  echo "🏗️  后台 build 启动，日志 → $LOG"
  nohup "${CMD[@]}" > "$LOG" 2>&1 &
  echo "PID=$! — tail -f $LOG 看进度"
  exit 0
fi

echo "🏗️  xcodebuild 验证中…"
"${CMD[@]}" > "$LOG" 2>&1
RC=$?

if [ $RC -eq 0 ]; then
  echo "✅ build 通过（日志 $LOG）"
else
  echo "❌ build 失败（尾部 30 行）"
  tail -30 "$LOG"
  echo ""
  echo "完整日志：$LOG"
fi

exit $RC
