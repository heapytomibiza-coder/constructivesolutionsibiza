/**
 * Content Preview Drawer
 * Shows full post/reply content, photos, thread context, and author info
 * before moderation decisions.
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
} from "lucide-react";
import { format } from "date-fns";
import type { AdminContentItem } from "../hooks/useAdminContent";

interface ContentPreviewDrawerProps {
  item: AdminContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (item: AdminContentItem) => void;
}

/** Fetch thread context: if it's a reply, get the parent post + sibling replies */
function useThreadContext(item: AdminContentItem | null) {
  const postId = item?.type === "reply" ? item.postId : item?.type === "post" ? item.id : null;

  return useQuery({
    queryKey: ["admin", "content", "thread", postId],
    queryFn: async () => {
      if (!postId) return null;

      const [postRes, repliesRes] = await Promise.all([
        supabase
          .from("forum_posts")
          .select("id, title, content, author_display_name, created_at, reply_count, view_count, tags, photos, category_id")
          .eq("id", postId)
          .maybeSingle(),
        supabase
          .from("forum_replies")
          .select("id, content, author_display_name, created_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: true })
          .limit(20),
      ]);

      return {
        post: postRes.data,
        replies: repliesRes.data ?? [],
      };
    },
    enabled: !!postId,
  });
}

export function ContentPreviewDrawer({
  item,
  open,
  onOpenChange,
  onDelete,
}: ContentPreviewDrawerProps) {
  const { data: thread, isLoading: threadLoading } = useThreadContext(open ? item : null);

  if (!item) return null;

  const isPost = item.type === "post";

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
          </div>
          <SheetTitle className="text-left">
            {isPost ? item.title || "Untitled Post" : `Reply to: ${item.postTitle || "Unknown Post"}`}
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
                <div className="text-sm font-medium">{item.authorName || "Unknown"}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {item.createdAt ? format(new Date(item.createdAt), "PPP 'at' p") : "—"}
                </div>
              </div>
            </div>
            {isPost && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {thread?.post?.view_count != null && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {thread.post.view_count}
                  </span>
                )}
                {item.replyCount != null && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {item.replyCount}
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Full Content */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Full Content
            </h4>
            <div className="prose prose-sm max-w-none text-foreground bg-muted/30 rounded-lg p-4 whitespace-pre-wrap break-words">
              {item.content}
            </div>
          </div>

          {/* Photos */}
          {isPost && item.photos && item.photos.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                Photos ({item.photos.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {item.photos.map((url, i) => (
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
          {isPost && thread?.post?.tags && thread.post.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {thread.post.tags.map((tag: string) => (
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
            {threadLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !thread ? (
              <p className="text-sm text-muted-foreground">No thread data available</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {/* Parent post (if viewing a reply) */}
                {!isPost && thread.post && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span className="font-medium text-foreground">
                        {thread.post.author_display_name || "Unknown"}
                      </span>
                      <span>·</span>
                      <span>Original Post</span>
                    </div>
                    <div className="text-sm font-medium">{thread.post.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {thread.post.content}
                    </div>
                  </div>
                )}

                {/* Replies in thread */}
                {thread.replies.map((reply) => {
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

                {thread.replies.length === 0 && isPost && (
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
