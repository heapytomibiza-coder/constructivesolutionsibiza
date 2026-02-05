

# Add Photo Uploads to Community Forum Posts

## Overview

Enable users to attach photos when creating forum posts, making it easier to explain what they need. "A picture is worth a thousand words" - especially for trade/repair questions.

---

## Current State

- Forum posts have: title, content, tags
- No photo support
- No storage bucket exists

---

## Proposed User Experience

When creating a new post:
```text
+-------------------------------------------+
|  New Post in "Where can I find..."        |
+-------------------------------------------+
|  Title: [________________________]        |
|                                           |
|  Content:                                 |
|  [_________________________________]      |
|  [_________________________________]      |
|                                           |
|  Photos (optional):                       |
|  +-------+  +-------+  +-------+          |
|  | Photo |  | Photo |  |  Add  |          |
|  |   1   |  |   2   |  | Photo |          |
|  +-------+  +-------+  +-------+          |
|  "Add photos to help explain your need"  |
|                                           |
|  Tags: [plumber, kitchen_______]          |
|                                           |
|  [Publish Post]  [Cancel]                 |
+-------------------------------------------+
```

When viewing a post:
- Photos display below the content
- Clickable thumbnails open full-size images

---

## Implementation Details

### 1. Create Storage Bucket

Create a public bucket for forum post images:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-images', 'forum-images', true);
```

Add RLS policies:
- Anyone can view (public bucket)
- Authenticated users can upload
- Users can delete their own uploads

### 2. Add Photos Column to forum_posts

```sql
ALTER TABLE public.forum_posts
ADD COLUMN photos text[] DEFAULT '{}';
```

This stores an array of public URLs to the uploaded images.

### 3. Update ForumNewPost.tsx

Add photo upload functionality similar to ExtrasStep in the job wizard:

- Add state: `photos: string[]`
- Add file input with `accept="image/*"` and `multiple`
- Upload to storage bucket on file select
- Show thumbnails with remove buttons
- Limit to 4 photos max
- Pass photos array to createForumPost

### 4. Update forumQueries.ts

Modify `createForumPost` to accept and insert photos:

```typescript
export async function createForumPost(
  categoryId: string,
  title: string,
  content: string,
  tags: string[] = [],
  photos: string[] = []  // NEW
): Promise<ForumPost> {
  // ... existing code ...
  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      category_id: categoryId,
      author_id: session.session.user.id,
      title,
      content,
      tags,
      photos,  // NEW
    })
    // ...
}
```

### 5. Update useForumData.ts Hook

Update mutation to include photos parameter.

### 6. Update ForumPost.tsx (Display)

Show photos in the post view:
- Grid of clickable thumbnails below content
- On click, open full-size image (using existing lightbox pattern or simple modal)

### 7. Update ForumPost Type

Add photos to the TypeScript interface:

```typescript
export interface ForumPost {
  // ... existing fields ...
  photos: string[];
}
```

---

## File Changes Summary

| Task | File(s) | Type |
|------|---------|------|
| Create `forum-images` bucket | Migration | DB |
| Add `photos` column | Migration | DB |
| Add storage RLS policies | Migration | DB |
| Photo upload UI | `ForumNewPost.tsx` | UI |
| Update create function | `forumQueries.ts` | Logic |
| Update mutation hook | `useForumData.ts` | Logic |
| Display photos | `ForumPost.tsx` | UI |

---

## Why This Matters

- Users often struggle to describe plumbing leaks, electrical issues, or damage in words
- Photos immediately clarify the scope and nature of the problem
- Professionals can give better advice when they can see the actual situation
- Reduces back-and-forth "can you describe it more?" replies

