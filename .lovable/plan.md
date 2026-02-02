

# Messaging UI Enhancements

## Summary
Add search filtering, smart time formatting, and keyboard shortcuts to the messaging UI. These are polish features that make the inbox feel like a real messaging app.

---

## What We're Adding

### 1. Smart Time Formatter Utility
A robust utility that displays times contextually:
- **Invalid/empty** → ""
- **Today** → "14:30"
- **This calendar week** (Mon-Sun) → "Mon"
- **Same year** → "Jan 15"
- **Different year** → "Jan 15, 2024"

### 2. Inbox Search
A search input at the top of the conversation list that filters by job title and message preview. Includes:
- Search icon with proper padding
- "No results" empty state
- `type="search"` for mobile keyboards

### 3. Keyboard Shortcuts + Hint
- Enter sends (existing behavior, made more robust)
- Shift+Enter for new line
- Ctrl/Cmd+Enter also sends
- Subtle hint text below composer

---

## Files to Create/Modify

| File | Action | Change |
|------|--------|--------|
| `src/lib/formatMessageTime.ts` | Create | Smart time formatter with calendar-week logic |
| `src/pages/messages/ConversationList.tsx` | Modify | Add search input, smart time, no-results state |
| `src/pages/messages/ConversationThread.tsx` | Modify | Robust keyboard handler + hint text |

---

## Implementation Details

### 1. Create `src/lib/formatMessageTime.ts`

```typescript
export function formatMessageTime(ts: string | null): string {
  if (!ts) return "";

  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();

  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Calendar-week check (Mon–Sun)
  const startOfWeek = new Date(now);
  const day = (now.getDay() + 6) % 7; // make Monday=0
  startOfWeek.setDate(now.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const isThisWeek = d >= startOfWeek && d < endOfWeek;

  if (isThisWeek) {
    return d.toLocaleDateString([], { weekday: "short" });
  }

  const isSameYear = d.getFullYear() === now.getFullYear();

  return d.toLocaleDateString(
    [],
    isSameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}
```

---

### 2. Update `src/pages/messages/ConversationList.tsx`

**Key changes:**
- Add `useState` for search query
- Add `useMemo` for filtered results
- Add search input with Search icon
- Replace `formatDistanceToNow` with `formatMessageTime`
- Add "No matching conversations" empty state

```typescript
// New imports
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatMessageTime } from "@/lib/formatMessageTime";

// Add search state and filtering
const [searchQuery, setSearchQuery] = useState("");

const filteredConversations = useMemo(() => {
  if (!conversations) return [];
  const needle = searchQuery.trim().toLowerCase();
  if (!needle) return conversations;
  
  return conversations.filter((c) => {
    const hay = `${c.job_title ?? ""} ${c.last_message_preview ?? ""}`.toLowerCase();
    return hay.includes(needle);
  });
}, [conversations, searchQuery]);

// Search input header (before conversation list)
<div className="p-3 border-b border-border">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      type="search"
      autoComplete="off"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search conversations..."
      className="pl-9"
    />
  </div>
</div>

// No results empty state
{filteredConversations.length === 0 && searchQuery && (
  <div className="py-8 px-4 text-center">
    <p className="text-sm text-muted-foreground">No matching conversations</p>
  </div>
)}
```

---

### 3. Update `src/pages/messages/ConversationThread.tsx`

**Keyboard handler (single condition, robust):**
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key !== "Enter") return;
  
  // Shift+Enter = new line, let it through
  if (e.shiftKey && !e.metaKey && !e.ctrlKey) return;
  
  // Enter or Ctrl/Cmd+Enter = send
  e.preventDefault();
  handleSend();
};
```

**Add hint text below composer:**
```tsx
<div className="p-4 border-t border-border bg-card">
  <div className="flex gap-2">
    {/* ... existing textarea and button */}
  </div>
  <p className="text-[11px] text-muted-foreground mt-2">
    Enter to send · Shift+Enter for new line
  </p>
</div>
```

---

## Visual Before/After

### Inbox Item (Before)
```text
Job Title                      2 hours ago
Preview text here...
You're the client
```

### Inbox Item (After)
```text
[🔍 Search conversations...]

Job Title                          14:30
Preview text here...
You're the client
```

### Composer (Before)
```text
[Type a message...        ] [Send]
```

### Composer (After)
```text
[Type a message...        ] [Send]
Enter to send · Shift+Enter for new line
```

---

## Test Checklist

1. **Search works**: Type in search box → filters by job title and preview
2. **No results state**: Search for gibberish → shows "No matching conversations"
3. **Clear search**: Empty search → shows all conversations again
4. **Time: Today**: Messages from today show time (e.g., "14:30")
5. **Time: This week**: Messages from earlier this week show weekday (e.g., "Mon")
6. **Time: Older**: Messages older than this week show date (e.g., "Jan 15")
7. **Invalid dates**: Don't crash, show empty string
8. **Keyboard: Enter**: Sends message
9. **Keyboard: Shift+Enter**: Adds new line
10. **Keyboard: Ctrl/Cmd+Enter**: Sends message
11. **Mobile**: Search input works, keyboard shows search type

