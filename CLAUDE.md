# Lucky Lance - Project Context

## Overview
Lucky Lance is a Next.js poker decision support PWA. Users photograph their hole cards and the board, and the app provides equity calculations, GTO recommendations, outs, hand odds, "What Beats Me" analysis, and AI-powered strategy explanations.

## Tech Stack
- **Framework:** Next.js 16.1.6 (Turbopack, App Router)
- **AI/Vision:** xAI Grok API via OpenAI SDK (`baseURL: https://api.x.ai/v1`)
  - Vision model: `grok-2-vision-latest` (card recognition)
  - Text model: `grok-3-mini` (strategy explanations)
- **State Management:** Zustand (`ui-store`, `game-store`)
- **Hand Evaluation:** pokersolver library
- **Animations:** Framer Motion (`motion/react`)
- **Styling:** Tailwind CSS with casino theme
- **Deployment:** Vercel (https://lucky-lance.vercel.app)

## Key Architecture

### Stores
- `src/stores/ui-store.ts` - UI state (screen, captured images, loading, errors, `isAddingBoardCards`)
- `src/stores/game-store.ts` - Game state (cards, variant, pot size, analysis result, GTO mode)

### API Routes
- `src/app/api/recognize-cards/route.ts` - Card recognition via Grok vision (supports hand-only, board-only, or both)
- `src/app/api/analyze-hand/route.ts` - Hand analysis engine (equity, outs, odds, what beats me)
- `src/app/api/explain/route.ts` - AI strategy explanations via Grok text model

### Engine (`src/engine/`)
- `hand-evaluator.ts` - pokersolver wrapper for hand evaluation/comparison
- `equity-calculator.ts` - Monte Carlo equity simulation
- `hand-odds.ts` - Hand improvement probability calculations
- `what-beats-me.ts` - Exhaustive opponent hand enumeration (~1,081 combos)
- `deck.ts` - Deck utilities
- `types.ts` - All TypeScript types/interfaces
- `validation.ts` - Card validation

### UI Flow
Main → Camera/Upload → Preview → (Pot Odds Input) → Loading → Results

The app supports playing through an entire hand: flop results → "Deal the Turn" → snap turn card → turn results → "Deal the River" → snap river card → river results, all without losing hole cards or existing board state.

### Key Components
- `src/components/layout/AppShell.tsx` - Main app shell, orchestrates all screens and logic
- `src/components/camera/ImagePreview.tsx` - Photo preview with dual (hand+board) or board-only mode
- `src/components/results/ResultsScreen.tsx` - Analysis results display
- `src/components/results/WhatBeatsMeDisplay.tsx` - Opponent beating hands analysis

## Environment Variables
- `XAI_API_KEY` - xAI API key (set in `.env.local` locally, configured in Vercel for production)

## Build & Deploy
```bash
npm run dev      # Local dev server
npm run build    # Production build
npx vercel --prod  # Deploy to Vercel
```

## Notes
- `src/lib/openai.ts` uses a fallback `"dummy-key-for-build"` so the OpenAI SDK doesn't crash during Vercel's build step when env vars aren't available
- Card recognition sends base64 images to xAI's vision model
- The "continue through streets" feature uses `isAddingBoardCards` flag to track board-only capture mode
