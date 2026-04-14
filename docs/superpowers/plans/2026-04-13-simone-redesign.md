# Simone Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **UI Tasks:** Use superpowers:frontend-design skill for visual design decisions during implementation.

**Goal:** Transform the DJ Cyber / Cyber Band prototype into Simone — a warm, music companion agent with full-screen ambient UI, genre quick-select, and PWA support.

**Architecture:** Mobile-first full-screen ambient interface. Chat bubbles float over genre-matched background images with CSS crossfade transitions. All audio/WS logic preserved from current page.tsx, UI layer completely replaced. Dead code from the band simulator era removed.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Claude Sonnet (chat), Google Lyria RealTime (music), Web Audio API, PWA (manifest + service worker)

---

## File Structure

### New Files
- `public/manifest.json` — PWA manifest
- `public/sw.js` — Service worker for offline shell caching
- `public/icons/icon-192.png` — App icon 192x192
- `public/icons/icon-512.png` — App icon 512x512
- `public/images/` — 8 ambient background images (one per genre + default)
- `src/app/simone-prompt.ts` — Simone's system prompt (extracted from page.tsx)
- `src/app/components/AmbientBackground.tsx` — Full-screen background with crossfade
- `src/app/components/GenreCards.tsx` — Quick-select genre buttons
- `src/app/components/MiniPlayer.tsx` — Bottom mini player bar
- `src/app/components/ChatBubbles.tsx` — Chat message display

### Modify
- `src/app/page.tsx` — Complete UI rewrite (keep all audio/WS hooks, replace JSX + system prompt)
- `src/app/layout.tsx` — Update title, meta, add manifest link, register SW
- `src/app/globals.css` — Replace cyber-band CSS vars with Simone palette
- `src/types/index.ts` — Remove band/sheet types, keep music types
- `package.json` — Rename to "simone"
- `CLAUDE.md` — Update project description

### Delete
- `src/data/characters.ts`
- `src/data/quick-actions.ts`
- `src/components/` — entire directory (BandLobby, CharacterCreator, ChatMessage, ChatPanel, PerformBar, QuickButtons, SheetMusicModal, StageCanvas)
- `src/canvas/` — entire directory (beat-sync, lights, sprite, stage-renderer)
- `src/ai/` — entire directory (prompts, param-extractor, sheet-generator)
- `src/audio/lyria-engine.ts` — old clip-based engine (audio-context.ts can stay if referenced)
- `src/app/jam/page.tsx`
- `src/app/lyria-test/page.tsx`
- `src/app/api/generate-sheet/route.ts`
- `src/app/api/generate-music/route.ts`
- `src/app/api/analyze-screen/route.ts`
- `server/` — Fly.io deployment artifacts
- `test_*.py` — all test scripts in project root

---

### Task 1: Clean Up Dead Code

**Files:**
- Delete: `src/data/characters.ts`, `src/data/quick-actions.ts`
- Delete: `src/components/` (entire directory)
- Delete: `src/canvas/` (entire directory)
- Delete: `src/ai/` (entire directory)
- Delete: `src/audio/lyria-engine.ts`
- Delete: `src/app/jam/page.tsx`, `src/app/lyria-test/page.tsx`
- Delete: `src/app/api/generate-sheet/route.ts`, `src/app/api/generate-music/route.ts`, `src/app/api/analyze-screen/route.ts`
- Delete: `server/` (entire directory)
- Delete: `test_*.py` (all test scripts in root)

- [ ] **Step 1: Delete all unused files**

```bash
# Old band simulator code
rm -rf src/data/ src/components/ src/canvas/ src/ai/
rm src/audio/lyria-engine.ts
rm -rf src/app/jam/ src/app/lyria-test/
rm src/app/api/generate-sheet/route.ts src/app/api/generate-music/route.ts src/app/api/analyze-screen/route.ts

# Fly.io artifacts
rm -rf server/

# Test scripts
rm -f test_*.py test_prompt_system.txt
```

- [ ] **Step 2: Simplify types**

Modify `src/types/index.ts` — remove all band/sheet types, keep only what's needed:

```typescript
export interface LyriaParams {
  stylePrompt: string;
  bpm: number;
  temperature: number;
  density: number;
  brightness: number;
  guidance: number;
}

export type Genre = 'chill' | 'jazz' | 'rock' | 'electronic' | 'lofi' | 'funk' | 'rnb';
```

- [ ] **Step 3: Verify build still passes**

```bash
npx tsc --noEmit
```

Expected: May have errors from page.tsx referencing deleted files. That's fine — page.tsx gets rewritten in Task 4. Just verify no unexpected issues.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old band simulator code, keep only Simone essentials"
```

---

### Task 2: Update Project Identity

**Files:**
- Modify: `package.json`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update package.json**

Change `name` field:

```json
{
  "name": "simone",
  "version": "2.0.0",
  "description": "Simone - AI Music Companion"
}
```

- [ ] **Step 2: Update layout.tsx**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Simone - AI Music Companion',
  description: '你的音乐陪伴，随时随地',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Simone',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a2e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Update globals.css**

```css
@import "tailwindcss";

:root {
  --simone-bg: #1a1a2e;
  --simone-surface: rgba(26, 26, 46, 0.85);
  --simone-accent: #e94560;
  --simone-text: #e0e0e0;
  --simone-text-muted: #888;
}

* { box-sizing: border-box; }

body {
  background: var(--simone-bg);
  color: var(--simone-text);
  margin: 0;
  overflow: hidden;
}
```

- [ ] **Step 4: Update CLAUDE.md**

Update project name, description, and key paths to reflect Simone. Remove references to Canvas stage, band members, and sheet music.

- [ ] **Step 5: Commit**

```bash
git add package.json src/app/layout.tsx src/app/globals.css CLAUDE.md
git commit -m "chore: rebrand to Simone — update identity, metadata, CSS palette"
```

---

### Task 3: PWA Setup

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `public/icons/icon-192.png` (placeholder)
- Create: `public/icons/icon-512.png` (placeholder)

- [ ] **Step 1: Create manifest.json**

```json
{
  "name": "Simone",
  "short_name": "Simone",
  "description": "你的音乐陪伴，随时随地",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Create service worker**

`public/sw.js` — minimal offline shell cache:

```javascript
const CACHE_NAME = 'simone-v1';
const SHELL = ['/', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
  }
});
```

- [ ] **Step 3: Create placeholder icons**

Generate simple placeholder icons (colored squares with "S" letter). These will be replaced with real icons later.

```bash
mkdir -p public/icons
# Use canvas or download placeholder — for now create minimal valid PNGs
```

- [ ] **Step 4: Register service worker in layout**

Add a client component or script tag in layout.tsx to register the service worker. Use a separate client component `src/app/components/SWRegister.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);
  return null;
}
```

Then import and render `<SWRegister />` in layout.tsx body.

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add public/manifest.json public/sw.js public/icons/ src/app/layout.tsx src/app/components/SWRegister.tsx
git commit -m "feat: add PWA support — manifest, service worker, app icons"
```

---

### Task 4: Ambient Background Component

**Files:**
- Create: `src/app/components/AmbientBackground.tsx`
- Create: `public/images/` (8 background images)

- [ ] **Step 1: Source ambient background images**

Download or generate 8 royalty-free images matching each genre's mood. Place in `public/images/`:

| File | Genre | Mood |
|------|-------|------|
| `bg-default.jpg` | Default | Calm dawn gradient |
| `bg-chill.jpg` | Chill | Sunset beach / soft clouds |
| `bg-jazz.jpg` | Jazz | Warm jazz bar lights |
| `bg-rock.jpg` | Rock | Concert stage neon |
| `bg-electronic.jpg` | Electronic | Neon cityscape |
| `bg-lofi.jpg` | Lo-Fi | Rainy window / cozy desk |
| `bg-funk.jpg` | Funk | Retro disco lights |
| `bg-rnb.jpg` | R&B | Purple night city glow |

Use the superpowers:frontend-design skill to finalize image selections and visual treatment.

- [ ] **Step 2: Create AmbientBackground component**

```tsx
'use client';

import { useState, useEffect } from 'react';

const GENRE_IMAGES: Record<string, string> = {
  default: '/images/bg-default.jpg',
  chill: '/images/bg-chill.jpg',
  jazz: '/images/bg-jazz.jpg',
  rock: '/images/bg-rock.jpg',
  electronic: '/images/bg-electronic.jpg',
  lofi: '/images/bg-lofi.jpg',
  funk: '/images/bg-funk.jpg',
  rnb: '/images/bg-rnb.jpg',
};

interface Props {
  genre: string;
}

export default function AmbientBackground({ genre }: Props) {
  const [currentImage, setCurrentImage] = useState(GENRE_IMAGES.default);
  const [nextImage, setNextImage] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const target = GENRE_IMAGES[genre] || GENRE_IMAGES.default;
    if (target === currentImage) return;

    setNextImage(target);
    setTransitioning(true);

    const timer = setTimeout(() => {
      setCurrentImage(target);
      setNextImage(null);
      setTransitioning(false);
    }, 1500); // match CSS transition duration

    return () => clearTimeout(timer);
  }, [genre, currentImage]);

  return (
    <div className="fixed inset-0 -z-10">
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms]"
        style={{ backgroundImage: `url(${currentImage})` }}
      />
      {nextImage && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms]"
          style={{
            backgroundImage: `url(${nextImage})`,
            opacity: transitioning ? 1 : 0,
          }}
        />
      )}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/AmbientBackground.tsx public/images/
git commit -m "feat: add ambient background component with genre-based crossfade"
```

---

### Task 5: Extract Simone System Prompt

**Files:**
- Create: `src/app/simone-prompt.ts`

- [ ] **Step 1: Create Simone's system prompt**

Extract and rewrite the system prompt from page.tsx. Change personality from "cool DJ" to "warm big sister". Keep all Lyria control rules intact. Add the new `genre` field requirement to JSON output.

Key differences from current DJ Cyber prompt:
- Personality: warm thoughtful big sister (not "cool DJ")
- Shorter responses: 1-2 sentences max
- Added `genre` field in JSON output (chill/jazz/rock/electronic/lofi/funk/rnb)
- Speaking style examples: caring, concise, natural
- Same music quality rules (instruments, transitions, bridge elements)
- Same config whitelist and action values

- [ ] **Step 2: Commit**

```bash
git add src/app/simone-prompt.ts
git commit -m "feat: add Simone system prompt — warm companion personality"
```

---

### Task 6: UI Components (GenreCards, MiniPlayer, ChatBubbles)

**Files:**
- Create: `src/app/components/GenreCards.tsx`
- Create: `src/app/components/MiniPlayer.tsx`
- Create: `src/app/components/ChatBubbles.tsx`

Use the superpowers:frontend-design skill for visual design of these components.

- [ ] **Step 1: Create GenreCards**

7 genre buttons (Chill, Jazz, Rock, Electronic, Lo-Fi, Funk, R&B) with emoji + label. Glass-morphism style (backdrop-blur, bg-white/10). Each button calls `onSelect(genreId, prompt)` which triggers a chat message.

- [ ] **Step 2: Create MiniPlayer**

Fixed bar above input field. Shows play/pause button, simplified frequency visualizer (32-bar canvas), and current genre label. Only visible when music is playing.

- [ ] **Step 3: Create ChatBubbles**

Scrollable chat area. User messages right-aligned with accent color. Simone messages left-aligned with glass background. "Simone" name label on AI messages. Loading state shows "想想看..." with pulse animation. System messages centered and muted.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/
git commit -m "feat: add Simone UI components — GenreCards, MiniPlayer, ChatBubbles"
```

---

### Task 7: Rewrite page.tsx

**Files:**
- Modify: `src/app/page.tsx`

This is the main task. Keep all audio/WS/jitter-buffer hooks from the current file. Replace the entire JSX return, system prompt reference, and state management around the old UI.

- [ ] **Step 1: Rewrite page.tsx**

The new page.tsx structure:

```
Imports
├── Components (AmbientBackground, GenreCards, MiniPlayer, ChatBubbles)
├── Simone prompt (from ./simone-prompt)
├── Types (Message, LyriaUpdate — keep inline)
├── Constants (WS_URL, SAMPLE_RATE, CHANNELS)

State
├── Chat: messages, input, isLoading
├── Music: genre (new!), wsConnected, status, currentPrompts, currentConfig
├── Refs: all existing audio/WS refs (unchanged)

Hooks (PRESERVE ALL EXISTING)
├── decodeB64ToPCM, updateBufferDepth, scheduleBuffers (unchanged)
├── playAudioChunk (unchanged)
├── connectWs (unchanged, update MediaSession title to "Simone")
├── sendWs (unchanged)
├── applyLyriaUpdate — add genre extraction from params
├── parseResponse — add genre extraction
├── handleSend (unchanged except system prompt reference)
├── Auto-reconnect effect (unchanged)
├── Background playback effect (update MediaSession title to "Simone")

New logic
├── handleGenreSelect — called from GenreCards, triggers handleSend with genre prompt
├── genre state — set from AI response's genre field

JSX Return
├── AmbientBackground (genre)
├── Main container (flex col, h-[100dvh])
│   ├── ChatBubbles or Initial greeting + GenreCards
│   ├── MiniPlayer (isPlaying, genre, analyser, onTogglePlay)
│   └── Input bar (input + send button)
```

Key changes from current page.tsx:
1. Import `SIMONE_SYSTEM_PROMPT` from `./simone-prompt`
2. Add `genre` state: `const [genre, setGenre] = useState('default')`
3. `parseResponse`: also extract `genre` field from JSON
4. `applyLyriaUpdate`: call `setGenre(params.genre)` when present
5. Add `handleGenreSelect(genreId, prompt)`: sets input to prompt, calls handleSend
6. Replace entire JSX with ambient + chat + mini player layout
7. Show GenreCards only when `messages.length === 0`
8. Update MediaSession metadata: title "Simone"
9. Remove: screen capture, old control panel, old visualizer canvas, showPanel toggle, config panel
10. Remove: quickActions array (replaced by GenreCards)

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Start dev server and test in browser**

```bash
npm run dev
```

Verify:
- Full-screen ambient background shows
- Greeting + genre cards display on initial state
- Tapping a card sends a message and music starts
- Simone responds with text
- Background image transitions with genre
- Mini player shows frequency visualization
- Chat bubbles work correctly
- Mobile layout looks good (Chrome DevTools responsive mode)

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: Simone full-screen ambient UI — chat + genre cards + mini player"
```

---

### Task 8: Final Polish and Deploy

**Files:**
- Modify: various

- [ ] **Step 1: Test PWA on mobile**

```bash
npm run build && npm run start
```

Open on phone, verify:
- "Add to Home Screen" works
- Opens without browser chrome
- Background playback works
- Genre cards work on touch

- [ ] **Step 2: Production build check**

```bash
npm run build
```

Ensure no build errors.

- [ ] **Step 3: Push and deploy**

```bash
git push origin main
```

Vercel auto-deploys from main. Verify live site works.

- [ ] **Step 4: Clean up .gitignore**

Ensure `test_*.py`, `*.pyc`, `__pycache__` etc. are in .gitignore.

- [ ] **Step 5: Final commit if needed**

```bash
git add -A
git commit -m "chore: Simone v2.0 — final polish and deploy"
```

---

## Execution Notes

- **Task 4 (backgrounds)** and **Task 6 (UI components)**: Use `superpowers:frontend-design` skill for visual design decisions — image selection, color tuning, spacing, component styling.
- **Task 7 (page.tsx rewrite)** is the heaviest task. The audio/WS hooks are battle-tested from 10 iterations — do NOT rewrite them. Only change the JSX layer and add genre state tracking.
- **Images**: If sourcing real photos is slow, start with solid color gradients per genre as placeholders. Replace with photos later.
