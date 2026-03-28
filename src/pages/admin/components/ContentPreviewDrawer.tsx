/**
 * Content Preview Drawer
 * Fetches canonical record from DB for moderation accuracy.
 * Shows full content, photos, thread context, and author profile link.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  MessageSquare,
  User,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Hash,
  MessageCircle,
  Eye,
  Trash2,
  Lock,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import type { AdminContentItem } from "../hooks/useAdminContent";

interface ContentPreviewDrawerProps {
  item: AdminContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (item: AdminContentItem) => void;
}

interface CanonicalPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_display_name: string | null;
  created_at: string | null;
  reply_count: number | null;
  view_count: number | null;
  tags: string[] | null;
  photos: string[] | null;
  category_id: string;
  is_locked: boolean;
  is_anonymous: boolean;
}

interface CanonicalReply {
  id: string;
  content: string;
  author_id: string;
  author_display_name: string | null;
  created_at: string | null;
  post_id: string;
}

interface CanonicalData {
  post: CanonicalPost | null;
  reply: CanonicalReply | null;
  threadReplies: Array<{
    id: string;
    content: string;
    author_id: string;
    author_display_name: string | null;
    created_at: string | null;
  }>;
}

/**
 * Fetches the canonical record from DB — the single source of truth
 * for moderation, not the list table's potentially stale/truncated data.
 */
function useCanonicalContent(item: AdminContentItem | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "content", "canonical", item?.type, item?.id],
    queryFn: async (): Promise<CanonicalData> => {
      if (!item) throw new Error("No item");

      if (item.type === "post") {
        const [postRes, repliesRes] = await Promise.all([
          supabase
            .from("forum_posts")
            .select("id, title, content, author_id, author_display_name, created_at, reply_count, view_count, tags, photos, category_id, is_locked, is_anonymous")
            .eq("id", item.id)
            .maybeSingle(),
          supabase
            .from("forum_replies")
            .select("id, content, author_id, author_display_name, created_at")
            .eq("post_id", item.id)
            .order("created_at", { ascending: true })
            .limit(20),
        ]);

        return {
          post: postRes.data as CanonicalPost | null,
          reply: null,
          threadReplies: repliesRes.data ?? [],
        };
      } else {
        // Reply: fetch the reply itself, its parent post, and sibling replies
        const replyRes = await supabase
          .from("forum_replies")
          .select("id, content, author_id, author_display_name, created_at, post_id")
          .eq("id", item.id)
          .maybeSingle();

        const postId = replyRes.data?.post_id;
        if (!postId) {
          return { post: null, reply: replyRes.data as CanonicalReply | null, threadReplies: [] };
        }

        const [postRes, repliesRes] = await Promise.all([
          supabase
            .from("forum_posts")
            .select("id, title, content, author_id, author_display_name, created_at, reply_count, view_count, tags, photos, category_id, is_locked, is_anonymous")
            .eq("id", postId)
            .maybeSingle(),
          supabase
            .from("forum_replies")
            .select("id, content, author_id, author_display_name, created_at")
            .eq("post_id", postId)
            .order("created_at", { ascending: true })
            .limit(20),
        ]);

        return {
          post: postRes.data as CanonicalPost | null,
          reply: replyRes.data as CanonicalReply | null,
          threadReplies: repliesRes.data ?? [],
        };
      }
    },
    enabled: enabled && !!item,
  });
}

export function ContentPreviewDrawer({
  item,
  open,
  onOpenChange,
  onDelete,
}: ContentPreviewDrawerProps) {
  const { data: canonical, isLoading } = useCanonicalContent(item, open);

  if (!item) return null;

  const isPost = item.type === "post";

  // Use canonical data when available, fall back to list item for immediate display
  const displayContent = isPost
    ? canonical?.post?.content ?? item.content
    : canonical?.reply?.content ?? item.content;
  const displayAuthorName = isPost
    ? canonical?.post?.author_display_name ?? item.authorName
    : canonical?.reply?.author_display_name ?? item.authorName;
  const displayAuthorId = isPost
    ? canonical?.post?.author_id ?? item.authorId
    : canonical?.reply?.author_id ?? item.authorId;
  const displayTitle = isPost
    ? canonical?.post?.title ?? item.title
    : canonical?.post?.title ?? item.postTitle;
  const displayPhotos = canonical?.post?.photos ?? item.photos ?? [];
  const displayTags = canonical?.post?.tags ?? [];
  const displayReplyCount = canonical?.post?.reply_count ?? item.replyCount ?? 0;
  const displayViewCount = canonical?.post?.view_count ?? 0;
  const displayCreatedAt = isPost
    ? canonical?.post?.created_at ?? item.createdAt
    : canonical?.reply?.created_at ?? item.createdAt;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            {isPost ? (
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                Post
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                Reply
              </Badge>
            )}
            {isLoading && (
              <Badge variant="outline" className="text-[10px] animate-pulse">
                Loading…
              </Badge>
            )}
          </div>
          <SheetTitle className="text-left">
            {isPost ? displayTitle || "Untitled Post" : `Reply to: ${displayTitle || "Unknown Post"}`}
          </SheetTitle>
          <SheetDescription className="text-left">
            Full content preview for moderation review
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Author & Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <button
                  className="text-sm font-medium hover:underline text-left"
                  onClick={() => {
                    if (displayAuthorId) {
                      // Navigate to admin user detail — open in current tab context
                      window.open(`/dashboard/admin?tab=users&user=${displayAuthorId}`, "_blank");
                    }
                  }}
                  title={displayAuthorId ? `View user ${displayAuthorId.slice(0, 8)}…` : undefined}
                >
                  {displayAuthorName || "Unknown"}
                </button>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {displayCreatedAt ? format(new Date(displayCreatedAt), "PPP 'at' p") : "—"}
                </div>
              </div>
            </div>
            {isPost && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {displayViewCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {displayReplyCount}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Full Content */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Full Content
            </h4>
            {isLoading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : (
              <div className="prose prose-sm max-w-none text-foreground bg-muted/30 rounded-lg p-4 whitespace-pre-wrap break-words">
                {displayContent}
              </div>
            )}
          </div>

          {/* Photos */}
          {isPost && displayPhotos.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                Photos ({displayPhotos.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {displayPhotos.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {isPost && displayTags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Thread Context */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Thread Context
            </h4>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !canonical ? (
              <p className="text-sm text-muted-foreground">No thread data available</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {/* Parent post (if viewing a reply) */}
                {!isPost && canonical.post && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span className="font-medium text-foreground">
                        {canonical.post.author_display_name || "Unknown"}
                      </span>
                      <span>·</span>
                      <span>Original Post</span>
                    </div>
                    <div className="text-sm font-medium">{canonical.post.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {canonical.post.content}
                    </div>
                  </div>
                )}

                {/* Replies in thread */}
                {canonical.threadReplies.map((reply) => {
                  const isCurrentItem = reply.id === item.id;
                  return (
                    <div
                      key={reply.id}
                      className={`rounded-lg border p-3 space-y-1 ${
                        isCurrentItem
                          ? "border-destructive/30 bg-destructive/5 ring-1 ring-destructive/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span className="font-medium text-foreground">
                          {reply.author_display_name || "Unknown"}
                        </span>
                        <span>·</span>
                        <span>
                          {reply.created_at
                            ? format(new Date(reply.created_at), "MMM d, HH:mm")
                            : "—"}
                        </span>
                        {isCurrentItem && (
                          <Badge variant="destructive" className="text-[9px] ml-1">
                            This item
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reply.content.length > 200 ? reply.content.slice(0, 200) + "…" : reply.content}
                      </div>
                    </div>
                  );
                })}

                {canonical.threadReplies.length === 0 && isPost && (
                  <p className="text-sm text-muted-foreground py-2">No replies yet</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 pb-4">
            {isPost && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/community/post/${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Live
                </a>
              </Button>
            )}
            {!isPost && <div />}
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove {isPost ? "Post" : "Reply"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
