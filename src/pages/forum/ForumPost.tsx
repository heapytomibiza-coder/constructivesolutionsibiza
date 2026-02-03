import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForumPost, useForumReplies, useCreateReply, useForumCategory } from "./hooks/useForumData";
import { useSession } from "@/contexts/SessionContext";
import { incrementPostViewCount } from "./queries/forumQueries";
import { ArrowLeft, MessageCircle, Clock, User, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

/**
 * FORUM POST PAGE
 * Displays a single post with its replies and reply form
 */

const ForumPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const { session } = useSession();
  const [replyContent, setReplyContent] = useState("");

  const { data: post, isLoading: postLoading } = useForumPost(postId ?? "");
  const { data: replies, isLoading: repliesLoading } = useForumReplies(postId ?? "");
  
  // Fetch category for breadcrumb
  const categoryId = post?.category_id ?? "";
  
  const createReply = useCreateReply();

  // Increment view count on mount
  useEffect(() => {
    if (postId) {
      incrementPostViewCount(postId);
    }
  }, [postId]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !postId) return;

    try {
      await createReply.mutateAsync({
        postId,
        content: replyContent.trim(),
      });
      setReplyContent("");
      toast.success("Reply posted!");
    } catch (err) {
      toast.error("Failed to post reply. Please try again.");
    }
  };

  const isLoading = postLoading || repliesLoading;

  if (!postLoading && !post) {
    return (
      <PublicLayout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Button asChild>
            <Link to="/forum">Back to Forum</Link>
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
          Back to Forum
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
              <h1 className="font-display text-2xl font-bold">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author_display_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.reply_count} {post.reply_count === 1 ? "reply" : "replies"}
                </span>
              </div>
              {post.tags.length > 0 && (
                <div className="flex gap-1 mt-3">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {post.content}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Replies section */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">
            {replies?.length ?? 0} {(replies?.length ?? 0) === 1 ? "Reply" : "Replies"}
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
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
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
              <p className="text-muted-foreground">No replies yet. Be the first to respond!</p>
            </div>
          )}
        </div>

        {/* Reply form */}
        {session ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitReply}>
                <h3 className="font-medium mb-3">Add a Reply</h3>
                <Textarea
                  placeholder="Share your thoughts, advice, or experience..."
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
                  {createReply.isPending ? "Posting..." : "Post Reply"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to join the discussion.
              </p>
              <Button asChild>
                <Link to={`/auth?redirect=/forum/post/${postId}`}>Sign In to Reply</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
};

export default ForumPost;
