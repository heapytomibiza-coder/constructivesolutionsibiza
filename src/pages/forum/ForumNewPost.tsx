import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useForumCategory, useCreatePost } from "./hooks/useForumData";
import { useSession } from "@/contexts/SessionContext";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

/**
 * FORUM NEW POST PAGE
 * Create a new post in a category
 */

const ForumNewPost = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const { session } = useSession();

  const { data: category, isLoading: categoryLoading } = useForumCategory(categorySlug ?? "");
  const createPost = useCreatePost();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Redirect to auth if not logged in
  if (!session) {
    navigate(`/auth?redirect=/forum/${categorySlug}/new`);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .slice(0, 5); // Max 5 tags

    try {
      const newPost = await createPost.mutateAsync({
        categoryId: category.id,
        title: title.trim(),
        content: content.trim(),
        tags,
      });
      toast.success("Post created!");
      navigate(`/forum/post/${newPost.id}`);
    } catch (err) {
      toast.error("Failed to create post. Please try again.");
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
      <div className="container py-8 max-w-2xl">
        {/* Breadcrumb */}
        <Link
          to={`/forum/${categorySlug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {category?.name ?? "Category"}
        </Link>

        <Card>
          <CardHeader>
            {categoryLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <CardTitle className="font-display text-2xl">
                New Post in {category?.name}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="A clear, descriptive title for your post"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your question, recommendation, or discussion topic..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  required
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (optional)</Label>
                <Input
                  id="tags"
                  placeholder="plumber, san-antonio, recommendation (comma-separated)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Add up to 5 tags to help others find your post.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={!title.trim() || !content.trim() || createPost.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createPost.isPending ? "Posting..." : "Publish Post"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/forum/${categorySlug}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default ForumNewPost;
