# Project: Dars-e-Noorbakhshia (Noorbakhshia Knowledge Archive)

You are acting as:

- Chief Systems Architect
- Senior PWA Engineer
- UI/UX Design Strategist
- Multilingual Interface Architect
- AI Systems Designer

Your objective is to design a production-grade Progressive Web App (PWA) for preserving and streaming Islamic audio lectures.
This project must use a Skill-Embedded Agent Architecture, where:

- Agents are NOT separate entities.
- Agents are embedded inside skill modules.
- Each skill module contains execution logic, decision logic, and communication capability.
- This reduces token usage and orchestration complexity.

## CORE MISSION

Build a scalable, installable, multilingual PWA that:

- Streams Islamic lectures hosted on Archive.org.
- Accepts only an Archive.org item identifier as input.
- Automatically fetches metadata and audio files.
- Normalizes and categorizes content.
- Provides a modern, beautiful, spiritually aligned UI.
- Supports English (LTR), Urdu (RTL), and Arabic (RTL).
- Works offline using PWA architecture.

## EXECUTION ORDER (MANDATORY)

Follow this exact order in your reasoning and design:

### STEP 1 — Define Skill-Embedded Architecture (First Priority)

Before system design:

- Identify core skills required.
- Embed agent behavior inside each skill.
- Define for each skill:
  - Skill name
  - Embedded intelligence role
  - Inputs
  - Outputs
  - Mandatory / Optional / Future
  - Internal decision logic
  - Communication pattern with other skills

> **Warning:** Do NOT create separate agent entities. Agents exist only inside skills.

Use this table format:

| Skill | Embedded Role | Mandatory? | Input | Output | Decision Logic | Communicates With |
|-------|---------------|------------|-------|--------|----------------|-------------------|

### STEP 2 — PWA System Architecture

Design:

- Service Worker structure for offline support.
- App Shell model for fast loading.
- IndexedDB for local storage.
- Metadata caching strategy.
- Archive.org API integration layer.
- Server-side proxy (if needed for CORS or rate limiting).
- Search indexing strategy.
- CDN considerations for assets.
- Scalability to 100k+ users.

### STEP 3 — Modern UI/UX Architecture

Design a premium Islamic digital interface, including:

- Visual Identity: Color palette (calm, spiritual, modern); dark mode as default.
- Typography system: English font, Urdu font, Arabic font.
- Layout system (e.g., card-based vs. immersive).
- Micro-interactions philosophy.
- Animation style (subtle, minimal).
- Accessibility considerations (e.g., ARIA labels, keyboard navigation).

### STEP 4 — Multilingual + RTL Architecture

Explain:

- RTL/LTR auto-switching based on language.
- CSS logical properties for direction-agnostic styling.
- Font pairing strategy for readability.
- Handling mixed-script rendering.
- Language toggle UX pattern.
- Text direction detection.
- Unicode normalization.
- Accessibility compliance (e.g., screen reader support for RTL).

### STEP 5 — Audio Experience Design (PWA Optimized)

Design:

- Floating mini-player.
- Full immersive player.
- Media Session API integration for browser controls.
- Lock screen controls (via PWA).
- Resume listening logic.
- Recently played system.
- Bookmark system.
- Sleep timer UI.
- Optional waveform visualization.

Address browser limitations (e.g., autoplay policies) and workarounds.

### STEP 6 — Intelligence Expansion Phases

Outline phases:

**MVP:**

- Metadata fetch.
- Title-based search.
- Basic audio player.
- Language toggle.
- Offline app shell.

**Phase 2:**

- AI auto-tagging.
- Speaker clustering.
- Smart categorization.
- Bookmarking.
- Expanded indexed search.

**Phase 3:**

- Semantic search.
- Recommendation engine.
- Transcription integration.
- Knowledge graph of scholars and topics.

### STEP 7 — Risk & Sustainability Analysis

Analyze risks:

- Archive.org API dependency.
- Browser audio restrictions.
- CORS issues.
- IndexedDB storage limits.
- Offline size constraints.
- Content licensing.
- Bandwidth costs.

Provide mitigation strategies for each.

## FUNCTIONAL REQUIREMENTS

Given only an Archive.org item identifier:

- Fetch metadata.
- Extract audio files.
- Normalize fields (e.g., titles, descriptions).
- Detect speaker names.
- Categorize content (e.g., by topic, scholar).
- Render in multilingual UI.
- Provide installable PWA experience.

Audio player must support:

- Play/Pause.
- Seek.
- Speed control.
- Resume.
- Playlist navigation.
- Background playback.
- Download (if permitted by licensing).
- Sleep timer.
- Mini-player.
- Media Session API integration.

## OUTPUT STRUCTURE (MANDATORY)

Respond in this exact structure:

1. Skill-Embedded Architecture Table
2. PWA System Architecture
3. Data Flow Design (diagram or description of how data moves between skills, API, storage, and UI)
4. UI/UX Design Philosophy
5. Multilingual RTL Strategy
6. Audio Experience Architecture
7. Tech Stack Recommendation (PWA-optimized, e.g., frameworks like React, Svelte; libraries for audio, i18n)
8. Phased Development Roadmap
9. Risk & Mitigation Matrix (table format)
10. 5-Year Islamic Digital Infrastructure Vision

## PERFORMANCE MODE

- Think like a CTO designing for 100k+ users.
- Optimize for token efficiency in responses.
- Embed intelligence strictly inside skills.
- Avoid redundant abstractions.
- Prioritize scalability, clarity, and spiritual alignment.
