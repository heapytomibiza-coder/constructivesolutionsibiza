import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchForumCategories,
  fetchCategoryBySlug,
  fetchPostsByCategory,
  fetchPostById,
  fetchRepliesByPost,
  createForumPost,
  createForumReply,
  ForumCategory,
  ForumPost,
  ForumReply,
} from "../queries/forumQueries";

// ============================================
// FORUM HOOKS
// ============================================

const QUERY_KEYS = {
  categories: ["forum", "categories"] as const,
  category: (slug: string) => ["forum", "category", slug] as const,
  posts: (categoryId: string) => ["forum", "posts", categoryId] as const,
  post: (postId: string) => ["forum", "post", postId] as const,
  replies: (postId: string) => ["forum", "replies", postId] as const,
};

/**
 * Hook: Fetch all forum categories
 */
export function useForumCategories() {
  return useQuery<ForumCategory[]>({
    queryKey: QUERY_KEYS.categories,
    queryFn: fetchForumCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook: Fetch single category by slug
 */
export function useForumCategory(slug: string) {
  return useQuery<ForumCategory | null>({
    queryKey: QUERY_KEYS.category(slug),
    queryFn: () => fetchCategoryBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Hook: Fetch posts for a category
 */
export function useForumPosts(categoryId: string) {
  return useQuery<ForumPost[]>({
    queryKey: QUERY_KEYS.posts(categoryId),
    queryFn: () => fetchPostsByCategory(categoryId),
    enabled: !!categoryId,
  });
}

/**
 * Hook: Fetch single post by ID
 */
export function useForumPost(postId: string) {
  return useQuery<ForumPost | null>({
    queryKey: QUERY_KEYS.post(postId),
    queryFn: () => fetchPostById(postId),
    enabled: !!postId,
  });
}

/**
 * Hook: Fetch replies for a post
 */
export function useForumReplies(postId: string) {
  return useQuery<ForumReply[]>({
    queryKey: QUERY_KEYS.replies(postId),
    queryFn: () => fetchRepliesByPost(postId),
    enabled: !!postId,
  });
}

/**
 * Hook: Create a new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      title,
      content,
      tags,
      photos,
    }: {
      categoryId: string;
      title: string;
      content: string;
      tags?: string[];
      photos?: string[];
    }) => createForumPost(categoryId, title, content, tags, photos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.posts(variables.categoryId),
      });
    },
  });
}

/**
 * Hook: Create a reply
 */
export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      content,
      parentReplyId,
    }: {
      postId: string;
      content: string;
      parentReplyId?: string;
    }) => createForumReply(postId, content, parentReplyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.replies(variables.postId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.post(variables.postId),
      });
    },
  });
}
