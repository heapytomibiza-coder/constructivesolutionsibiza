

# AI Bio Builder — Implementation Plan

## What this is
A "Help me write this" button inside the bio section of ProfileEdit. Opens an inline guided flow that uses the pro's already-selected services as context, asks 4 optional questions, calls AI, and drops a polished bio into the existing textarea.

## UX Flow

1. User clicks "Help me write this" below the bio textarea
2. Inline panel appears showing their selected services as context
3. Four questions presented one at a time (all skippable):
   - What are you best known for on site?
   - What do you take most pride in?
   - What kind of projects do you usually work on?
   - How do you usually work day-to-day?
4. Optional fifth: "Anything else clients should know?"
5. Click "Generate my bio" → loading state → bio appears in textarea
6. User edits and saves normally through existing form

Minimum requirement: at least one selected service OR one answered question.

## Voice Input
- Browser Web Speech API via mic icon on each input
- Tap to record, transcript fills input, fallback to typing
- No external dependencies

## Technical Shape

### New files

**`src/components/professional/BioBuilder.tsx`**
- Receives `onBioGenerated: (bio: string) => void` callback
- Fetches user's services via `professional_services` joined to `service_micro_categories` for display names
- Manages step state (intro → q1 → q2 → q3 → q4 → optional q5 → generate)
- Calls edge function via `supabase.functions.invoke('generate-bio', { body })`
- Shows loading state during generation

**`src/components/professional/VoiceInput.tsx`**
- Wraps browser `SpeechRecognition` API
- Small mic button component
- Returns transcript to parent via callback
- Graceful fallback if browser doesn't support it

**`supabase/functions/generate-bio/index.ts`**
- Auth-gated (same pattern as `listing-description-assist`)
- Uses shared CORS (`getCorsHeaders`)
- Calls Lovable AI gateway (`google/gemini-3-flash-preview`)
- Non-streaming (single response)
- System prompt enforces grounded, trade-appropriate tone
- Inputs: services array, business_name, 4-5 answer fields
- Output: plain text bio, max 500 chars

### Modified file

**`src/pages/professional/ProfileEdit.tsx`**
- Import BioBuilder
- Add "Help me write this" button below the bio textarea (inside the existing FormField)
- On bio generated: `form.setValue('bio', generatedBio)` to populate the textarea
- Toggle state to show/hide the builder panel

### Prompt (in edge function)
Uses the adapted prompt from the user's specification — grounded tone, no buzzwords, first person, 2-4 sentences, max 500 chars, only uses provided information.

### Error handling
- 429 → toast "Too many requests, try again shortly"
- 402 → toast "AI credits exhausted"
- Network/other → toast "Failed to generate bio, try again"

## What does NOT change
- No new routes
- No new database tables
- No redesign of profile page
- Manual bio writing still works
- Bio saves through existing form to `professional_profiles.bio`

