

# Add Voice Input to UniversalSearchBar

## What changes

Add the existing `VoiceInput` component to `UniversalSearchBar` so users can speak their search query instead of typing. The mic button sits inside the search input, to the left of the ⌘K hint.

## File changes

### `src/components/search/UniversalSearchBar.tsx`

1. Import `VoiceInput` from `@/components/professional/VoiceInput`
2. Add a `VoiceInput` inside the search bar area, positioned absolute right (before the ⌘K kbd hint)
3. `onTranscript` sets the query and opens results: `setQuery(text); setIsOpen(true);`
4. Adjust `CommandInput` right padding (`pr-24`) to avoid overlapping the mic button
5. Move the ⌘K hint left slightly to accommodate the mic icon

### Layout

```text
┌──────────────────────────────────────────┐
│ 🔍  Fix a leaking tap...        🎤  ⌘K  │
└──────────────────────────────────────────┘
```

- Mic button renders only when browser supports SpeechRecognition (existing `VoiceInput` behavior)
- On mobile (no ⌘K hint shown), mic sits alone on the right
- When listening, mic turns red (existing styling)

## What does NOT change

- No new components or files
- No backend changes
- Existing keyboard, typing, and result selection flows unchanged
- VoiceInput component unchanged

