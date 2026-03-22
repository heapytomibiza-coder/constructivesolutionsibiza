import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useForumPost, useForumReplies, useCreateReply, useUpdatePost } from "./hooks/useForumData";
import { useSession } from "@/contexts/SessionContext";
import { incrementPostViewCount } from "./queries/forumQueries";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Clock, User, Send, Image, Pencil, X, ImagePlus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enGB } from "date-fns/locale";
import { toast } from "sonner";
import i18n from "@/i18n";

/**
 * FORUM POST PAGE
 * Displays a single post with its replies and reply form
 */

const ForumPost = () => {
  const { t } = useTranslation("forum");
  const { postId } = useParams<{ postId: string }>();
  const { session } = useSession();
  const [replyContent, setReplyContent] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: post, isLoading: postLoading } = useForumPost(postId ?? "");
  const { data: replies, isLoading: repliesLoading } = useForumReplies(postId ?? "");
  
  const dateLocale = i18n.language?.startsWith("es") ? es : enGB;
  
  const createReply = useCreateReply();
  const updatePost = useUpdatePost();

  const isAuthor = session?.user?.id === post?.author_id;

  // Increment view count on mount
  useEffect(() => {
    if (postId) {
      incrementPostViewCount(postId);
    }
  }, [postId]);

  const startEditing = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditTags((post.tags ?? []).join(", "));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim() || !postId) return;

    const tags = editTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .slice(0, 5);

    try {
      await updatePost.mutateAsync({
        postId,
        title: editTitle.trim(),
        content: editContent.trim(),
        tags,
        photos: post?.photos ?? [],
      });
      setIsEditing(false);
      toast.success(t("toast.postCreated"));
    } catch (err) {
      toast.error(t("toast.postError"));
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !postId) return;

    try {
      await createReply.mutateAsync({
        postId,
        content: replyContent.trim(),
      });
      setReplyContent("");
      toast.success(t("replies.success"));
    } catch (err) {
      toast.error(t("replies.error"));
    }
  };

  if (!postLoading && !post) {
    return (
      <PublicLayout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("post.notFound")}</h1>
          <Button asChild>
            <Link to="/forum">{t("backToForum")}</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container py-8 max-w-4xl">
        {/* Breadcrumb */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToForum")}
        </Link>

        {/* Post */}
        {postLoading ? (
          <Card className="mb-8">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : post && (
          <Card className="mb-8">
            <CardHeader>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">{t("post.title")}</Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={150}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="font-display text-2xl font-bold">{post.title}</h1>
                    {isAuthor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={startEditing}
                        className="shrink-0"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {t("post.edit")}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author_display_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.reply_count} {post.reply_count === 1 ? t("replies.reply") : t("replies.replies")}
                    </span>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1 mt-3">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-content">{t("post.content")}</Label>
                    <Textarea
                      id="edit-content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">{t("post.tags")}</Label>
                    <Input
                      id="edit-tags"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder={t("post.tagsPlaceholder")}
                    />
                    <p className="text-xs text-muted-foreground">{t("post.tagsHelp")}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveEdit}
                      disabled={!editTitle.trim() || !editContent.trim() || updatePost.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {updatePost.isPending ? t("post.saving") : t("post.save")}
                    </Button>
                    <Button variant="outline" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-1" />
                      {t("post.cancelEdit")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                    {post.content}
                  </div>
                  
                  {/* Photos */}
                  {post.photos && post.photos.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <Image className="h-4 w-4" />
                        {post.photos.length} {post.photos.length === 1 ? t("post.photo") : t("post.photos_plural")}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {post.photos.map((url, index) => (
                          <button
                            key={url}
                            onClick={() => setLightboxUrl(url)}
                            className="aspect-square overflow-hidden rounded-lg border hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={url}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Replies section */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">
            {replies?.length ?? 0} {(replies?.length ?? 0) === 1 ? t("replies.reply") : t("replies.replies")}
          </h2>

          {repliesLoading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!repliesLoading && replies && replies.length > 0 && (
            <div className="space-y-4">
              {replies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {reply.author_display_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                      {reply.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!repliesLoading && replies && replies.length === 0 && (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">{t("replies.noReplies")}</p>
            </div>
          )}
        </div>

        {/* Reply form */}
        {session ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitReply}>
                <h3 className="font-medium mb-3">{t("replies.addReply")}</h3>
                <Textarea
                  placeholder={t("replies.write")}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  className="mb-4"
                />
                <Button
                  type="submit"
                  disabled={!replyContent.trim() || createReply.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createReply.isPending ? t("replies.submitting") : t("replies.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                {t("auth.signInPrompt")}
              </p>
              <Button asChild>
                <Link to={`/auth?redirect=/forum/post/${postId}`}>{t("auth.signInToReply")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-none">
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt="Full size"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
};

export default ForumPost;