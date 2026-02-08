/**
 * Admin Content Hook
 * Fetches forum posts and replies for moderation.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContentType = "post" | "reply";
export type ContentFilter = "all" | "recent" | "reported";

export interface AdminContentItem {
  id: string;
  type: ContentType;
  title: string | null;
  content: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
  postId?: string; // For replies
  postTitle?: string; // For replies
  replyCount?: number; // For posts
  photos?: string[]; // For posts
}

interface UseAdminContentOptions {
  filter?: ContentFilter;
  search?: string;
  type?: ContentType | "all";
}

async function fetchAdminContent(
  filter: ContentFilter,
  search: string,
  type: ContentType | "all"
): Promise<AdminContentItem[]> {
  const items: AdminContentItem[] = [];

  // Fetch posts if type is "all" or "post"
  if (type === "all" || type === "post") {
    let postsQuery = supabase
      .from("forum_posts")
      .select("id, title, content, author_id, author_display_name, created_at, reply_count, photos")
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter === "recent") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      postsQuery = postsQuery.gte("created_at", weekAgo.toISOString());
    }

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) throw postsError;

    for (const post of posts ?? []) {
      items.push({
        id: post.id,
        type: "post",
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        authorName: post.author_display_name,
        createdAt: post.created_at ?? "",
        replyCount: post.reply_count ?? 0,
        photos: post.photos ?? [],
      });
    }
  }

  // Fetch replies if type is "all" or "reply"
  if (type === "all" || type === "reply") {
    let repliesQuery = supabase
      .from("forum_replies")
      .select(`
        id,
        content,
        author_id,
        author_display_name,
        created_at,
        post_id,
        forum_posts!inner(title)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter === "recent") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      repliesQuery = repliesQuery.gte("created_at", weekAgo.toISOString());
    }

    const { data: replies, error: repliesError } = await repliesQuery;

    if (repliesError) throw repliesError;

    for (const reply of replies ?? []) {
      const postData = reply.forum_posts as { title: string } | null;
      items.push({
        id: reply.id,
        type: "reply",
        title: null,
        content: reply.content,
        authorId: reply.author_id,
        authorName: reply.author_display_name,
        createdAt: reply.created_at ?? "",
        postId: reply.post_id,
        postTitle: postData?.title ?? "Unknown Post",
      });
    }
  }

  // Sort all items by createdAt descending
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply search filter
  if (search.trim()) {
    const term = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term) ||
        item.authorName?.toLowerCase().includes(term)
    );
  }

  return items;
}

export function useAdminContent(options: UseAdminContentOptions = {}) {
  const { filter = "all", search = "", type = "all" } = options;

  return useQuery({
    queryKey: ["admin", "content", filter, search, type],
    queryFn: () => fetchAdminContent(filter, search, type),
    staleTime: 30_000,
  });
}
