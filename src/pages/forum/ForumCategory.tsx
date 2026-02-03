import { Link, useParams, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useForumCategory, useForumPosts } from "./hooks/useForumData";
import { useSession } from "@/contexts/SessionContext";
import { ArrowLeft, Plus, MessageCircle, Pin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * FORUM CATEGORY PAGE
 * Displays posts within a category with "New Post" CTA
 */

const ForumCategory = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const { session } = useSession();

  const { data: category, isLoading: categoryLoading } = useForumCategory(categorySlug ?? "");
  const { data: posts, isLoading: postsLoading } = useForumPosts(category?.id ?? "");

  const isLoading = categoryLoading || postsLoading;

  const handleNewPost = () => {
    if (!session) {
      navigate("/auth?redirect=/forum/" + categorySlug + "/new");
    } else {
      navigate(`/forum/${categorySlug}/new`);
    }
  };

  if (!categoryLoading && !category) {
    return (
      <PublicLayout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Button asChild>
            <Link to="/forum">Back to Forum</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forum
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            {categoryLoading ? (
              <>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-72" />
              </>
            ) : (
              <>
                <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
                  {category?.icon && <span className="text-3xl">{category.icon}</span>}
                  {category?.name}
                </h1>
                <p className="text-muted-foreground mt-1">{category?.description}</p>
              </>
            )}
          </div>
          <Button onClick={handleNewPost} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Posts list */}
        {!isLoading && posts && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} to={`/forum/post/${post.id}`}>
                <Card className="hover:shadow-soft hover:border-primary/20 transition-all cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      {post.is_pinned && (
                        <Pin className="h-4 w-4 text-primary shrink-0 mt-1" />
                      )}
                      <CardTitle className="text-lg font-medium leading-snug">
                        {post.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.reply_count} {post.reply_count === 1 ? "reply" : "replies"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                      {post.tags.length > 0 && (
                        <div className="flex gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && posts && posts.length === 0 && (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to start a discussion in this category.
            </p>
            <Button onClick={handleNewPost}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default ForumCategory;
