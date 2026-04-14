# Lyria RealTime API Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Magenta RT model with Google Lyria RealTime API — no more Colab GPU, just a lightweight Python WS bridge that talks to the Lyria API.

**Architecture:** The Python WS bridge (`colab_server.py`) currently loads a local Magenta RT model on a GPU. Replace it with a thin bridge that connects to Google's Lyria RealTime API via the `google-genai` SDK. The WS protocol between browser and our bridge stays identical. Frontend changes are minimal — remove Opus/dgz decoders (Lyria sends raw PCM), update config param names, update system prompt.

**Tech Stack:** Python 3.10+ (websockets + google-genai SDK), Next.js 16 (unchanged), Cloudflare Tunnel (unchanged)

---

## File Structure

### Modify
- `colab_server.py` — Complete rewrite: replace Magenta RT with google-genai Lyria RealTime API
- `simone_server.ipynb` — Simplify: no GPU needed, no model loading, just pip install + run
- `src/app/page.tsx` — Remove Opus/dgz decoders, update config param name (`guidance_weight` → `guidance`), remove `pako` import
- `src/app/simone-prompt.ts` — Update config param docs, add new Lyria params (density, brightness)
- `.env.local` — Uses existing `GEMINI_API_KEY`
- `package.json` — Remove `pako` dependency
- `requirements.txt` — Replace with `google-genai aiohttp websockets nest_asyncio`

### No changes needed
- `src/app/components/` — All UI components unchanged
- `src/app/api/chat/route.ts` — Chat API unchanged
- `src/app/pool-elements.ts` — Prompts already in good Lyria format

---

### Task 1: Rewrite colab_server.py for Lyria RealTime API

**Files:**
- Modify: `colab_server.py`
- Modify: `requirements.txt`

The bridge currently loads a local Magenta RT model on GPU, generates chunks locally, applies crossfade, encodes to Opus. New bridge connects to Lyria RealTime API — no GPU, no model loading, no encoding.

Key mapping:
- `mrt.embed_style()` + `mrt.generate_chunk()` → `session.set_weighted_prompts()` + `session.play()` + `session.receive()`
- Lyria handles transitions internally, no manual crossfade needed
- Audio format identical: 16-bit PCM, 48kHz, stereo
- Same WS commands: `set_prompts`, `play`, `pause`, `stop`, `set_config`, `reset_context`

Reference: `~/Desktop/lyria-realtime-test/server.py` (working Lyria bridge)

- [ ] **Step 1: Update requirements.txt**

- [ ] **Step 2: Rewrite colab_server.py**

- [ ] **Step 3: Commit**

---

### Task 2: Simplify Colab Notebook

**Files:**
- Modify: `simone_server.ipynb`

No GPU needed. Notebook becomes 2 code cells: install deps + set API key and run.

- [ ] **Step 1: Rewrite simone_server.ipynb**

- [ ] **Step 2: Commit**

---

### Task 3: Update Frontend — Remove Magenta-specific Audio Decoders

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `package.json`

Remove Opus decoder, dgz decoder, pako import. Simplify onmessage to just handle raw PCM base64. Rename `guidance_weight` → `guidance` in config handling.

- [ ] **Step 1: Remove pako import and dgz decoder**
- [ ] **Step 2: Simplify onmessage handler — remove opus/dgz branches**
- [ ] **Step 3: Update applyLyriaUpdate — rename guidance_weight to guidance, add density/brightness/bpm**
- [ ] **Step 4: Remove pako from package.json**
- [ ] **Step 5: Verify build passes**
- [ ] **Step 6: Commit**

---

### Task 4: Update System Prompt for Lyria RealTime

**Files:**
- Modify: `src/app/simone-prompt.ts`

Change "Magenta RealTime" → "Lyria RealTime". Update config params: `guidance_weight` → `guidance` (range 0.0-6.0). Add density/brightness params.

- [ ] **Step 1: Update simone-prompt.ts**
- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

---

### Task 5: Update CLAUDE.md and Push

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md references from Magenta to Lyria**
- [ ] **Step 2: Commit and push**

---

### Task 6: End-to-End Test

- [ ] **Step 1: Run server locally with Gemini API key**
- [ ] **Step 2: Connect frontend via gear button**
- [ ] **Step 3: Test style selection and audio playback**
- [ ] **Step 4: Test style switching (smooth transition)**
- [ ] **Step 5: Test chat interaction**
- [ ] **Step 6: Test pause/resume**
