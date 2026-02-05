import { supabase } from "@/integrations/supabase/client";

// ============================================
// FORUM QUERY LAYER
// ============================================

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface ForumPost {
  id: string;
  category_id: string;
  author_id: string;
  author_display_name: string;
  title: string;
  content: string;
  tags: string[];
  photos: string[];
  is_pinned: boolean;
  reply_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  post_id: string;
  author_id: string;
  author_display_name: string;
  content: string;
  parent_reply_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active forum categories
 */
export async function fetchForumCategories(): Promise<ForumCategory[]> {
  const { data, error } = await supabase
    .from("forum_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch a single category by slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<ForumCategory | null> {
  const { data, error } = await supabase
    .from("forum_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/**
 * Fetch posts for a category
 */
export async function fetchPostsByCategory(categoryId: string): Promise<ForumPost[]> {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("category_id", categoryId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch a single post by ID
 */
export async function fetchPostById(postId: string): Promise<ForumPost | null> {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/**
 * Fetch replies for a post
 */
export async function fetchRepliesByPost(postId: string): Promise<ForumReply[]> {
  const { data, error } = await supabase
    .from("forum_replies")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Create a new forum post
 */
export async function createForumPost(
  categoryId: string,
  title: string,
  content: string,
  tags: string[] = [],
  photos: string[] = []
): Promise<ForumPost> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      category_id: categoryId,
      author_id: session.session.user.id,
      title,
      content,
      tags,
      photos,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a reply to a post
 */
export async function createForumReply(
  postId: string,
  content: string,
  parentReplyId?: string
): Promise<ForumReply> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("forum_replies")
    .insert({
      post_id: postId,
      author_id: session.session.user.id,
      content,
      parent_reply_id: parentReplyId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Increment view count for a post (best-effort, no RPC needed)
 */
export async function incrementPostViewCount(postId: string): Promise<void> {
  // View count increment is nice-to-have; we'll skip for MVP
  // Could implement later with RPC or edge function
  console.debug("View count increment skipped for:", postId);
}
