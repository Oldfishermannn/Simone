# Simone - AI Music Companion

## Overview

Simone is an AI music companion agent. She is a warm, thoughtful "big sister" figure who generates real-time music to accompany users through daily life — studying, driving, partying, relaxing at home. Users chat with Simone in natural language, and she creates and adjusts live music to match the mood.

This spec covers the redesign from the current "DJ Cyber / Cyber Band" prototype into the Simone product.

## Product Identity

- **Name**: Simone
- **Personality**: Warm, thoughtful, concise. Like a knowledgeable older sister who always knows what to play.
- **Greeting**: "嗨，想听点什么？"
- **Language**: Chinese conversation, English music prompts (invisible to user)
- **Tone examples**:
  - "累了吧，给你换个轻松的。"
  - "这首怎么样？我觉得挺适合现在的。"
  - "好的，鼓点加重一点。"

## Core User Flow

1. Open app → full-screen ambient background + "嗨，想听点什么？"
2. 7 quick-select genre cards appear below greeting: Chill, Jazz, Rock, Electronic, Lo-Fi, Funk, R&B
3. User taps a card or types a message → Simone responds + music starts playing
4. User continues chatting to adjust: "换个轻松点的" / "加点鼓" / "BPM 快一点"
5. Background image transitions with music style changes (CSS crossfade)
6. Music plays continuously, including in background (lock screen controls via MediaSession API)

## Interface Design

### Layout (Mobile-First)

```
┌─────────────────────────┐
│                         │
│   Full-screen ambient   │
│   background image      │
│                         │
│   ┌─────────────────┐   │
│   │ Chat bubbles    │   │
│   │ (semi-transparent│   │
│   │  backdrop)      │   │
│   └─────────────────┘   │
│                         │
│   [Mini player bar]     │
│   [Input field    ][>]  │
└─────────────────────────┘
```

### Initial State (No Music Playing)

```
┌─────────────────────────┐
│                         │
│   Ambient background    │
│                         │
│   "嗨，想听点什么？"      │
│                         │
│  [Chill][Jazz][Rock]    │
│  [Electronic][Lo-Fi]    │
│  [Funk][R&B]            │
│                         │
│   [Input field    ][>]  │
└─────────────────────────┘
```

### Components

- **Ambient Background**: Full-screen image, changes with music genre. ~10-15 images covering all genres. CSS crossfade transition (1-2s).
- **Chat Area**: Floating bubbles with semi-transparent backdrop. Scrollable. Simone's messages on the left, user's on the right.
- **Genre Cards**: Only shown on initial state or when no music is playing. Disappear once music starts (accessible via chat).
- **Mini Player Bar**: Fixed above input. Shows current genre/mood label, simple frequency visualizer, play/pause button.
- **Input Field**: Bottom of screen, always visible. Safe area inset for notch devices.

### Ambient Background Images (by Genre)

| Genre | Image Mood |
|-------|-----------|
| Chill | Sunset beach / soft clouds |
| Jazz | Dimly lit jazz bar / warm lights |
| Rock | Concert stage / neon lights |
| Electronic | Neon cityscape / abstract lights |
| Lo-Fi | Rainy window / cozy desk |
| Funk | Retro disco / colorful lights |
| R&B | Purple/blue night city / soft glow |
| Default | Calm gradient / dawn sky |

## Simone's System Prompt

Simone replaces DJ Cyber. Key changes from current system prompt:

- Personality: warm thoughtful big sister (not "cool DJ")
- Shorter responses: 1-2 sentences max
- Same JSON output format for Lyria control (prompts/config/action)
- Same music quality rules (instruments, transitions, bridge elements)
- Removes all DJ/mixing metaphors, replaces with caring companion language

## Technical Architecture

### Stack (Unchanged)

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Chat API**: Claude Sonnet via `/api/chat/route.ts`
- **Music**: Google Lyria RealTime via Python WebSocket bridge
- **WS Bridge**: Python aiohttp server on Render.com
- **Audio**: Web Audio API, adaptive jitter buffer, GainNode fades

### PWA Support (New)

- `manifest.json`: app name "Simone", theme color, icons
- Service worker for offline shell caching
- `display: "standalone"` — no browser chrome
- "Add to Home Screen" prompt
- Future: Capacitor wrapper for App Store / Google Play

### Background Playback (Existing)

- Silent `<audio>` element keep-alive
- MediaSession API with lock screen controls
- visibilitychange WS recovery
- AudioContext resume on foreground

## Code Changes Required

### Remove

- `src/data/characters.ts` — band member presets (BLAZE, GROOVE, etc.)
- `src/components/BandLobby.tsx` — band lobby UI
- `src/components/CharacterCreator.tsx` — character creation
- `src/canvas/` — entire Canvas stage rendering system
- `src/ai/prompts.ts` — old character prompt builders
- `src/components/StageCanvas.tsx` — stage canvas component
- `src/components/PerformBar.tsx` — perform bar
- `src/components/SheetMusicModal.tsx` — sheet music display
- `src/ai/sheet-generator.ts` — sheet music generation
- `src/ai/param-extractor.ts` — old param extraction
- `src/app/api/generate-sheet/route.ts` — sheet API
- `src/app/api/generate-music/route.ts` — old clip generation API
- `src/app/api/analyze-screen/route.ts` — screen analysis API
- `src/app/jam/page.tsx` — old jam page
- `src/app/lyria-test/page.tsx` — test page
- `src/audio/lyria-engine.ts` — old clip-based engine (replaced by WS bridge)
- `src/data/quick-actions.ts` — old quick action buttons
- `server/` directory — Fly.io deployment artifacts

### Modify

- `src/app/page.tsx` — Complete UI redesign: full-screen ambient + chat + mini player
- `src/app/layout.tsx` — Update title/meta to "Simone"
- `src/app/api/chat/route.ts` — Keep, update system prompt reference
- `src/types/index.ts` — Simplify, remove band/sheet types
- `CLAUDE.md` — Update project description
- `package.json` — Update name to "simone"

### Add

- `public/manifest.json` — PWA manifest
- `public/images/` — Ambient background images (~10-15)
- `public/icons/` — App icons (192x192, 512x512)
- Service worker registration

## Out of Scope (Future)

- Particle/shader background animations (replace images later)
- Voice input ("Hey Simone")
- Capacitor native app packaging
- User accounts / preference memory across sessions
- Spotify/Apple Music integration
- Multiple language support
