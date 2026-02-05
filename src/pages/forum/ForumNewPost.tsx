import { useState, useRef } from "react";
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
import { ArrowLeft, Send, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to auth if not logged in
  if (!session) {
    navigate(`/auth?redirect=/forum/${categorySlug}/new`);
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 4 - photos.length;
    if (remaining <= 0) {
      toast.error("Maximum 4 photos allowed");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("forum-images")
          .upload(path, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("forum-images")
          .getPublicUrl(path);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} photo(s) uploaded`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

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
        photos,
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

              {/* Photos */}
              <div className="space-y-2">
                <Label>Photos (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add up to 4 photos to help explain what you need.
                </p>
                
                {/* Photo grid */}
                <div className="flex flex-wrap gap-3">
                  {photos.map((url, index) => (
                    <div key={url} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {photos.length < 4 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-24 h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6" />
                          <span className="text-xs">Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={!title.trim() || !content.trim() || createPost.isPending || uploading}
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
