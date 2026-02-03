import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useForumCategories } from "./hooks/useForumData";
import { MessageCircle, ThumbsUp, Search, AlertTriangle } from "lucide-react";

/**
 * FORUM INDEX PAGE
 * Displays all forum categories with icons and descriptions
 */

const categoryIconMap: Record<string, React.ReactNode> = {
  recommendations: <ThumbsUp className="h-6 w-6" />,
  "where-can-i-find": <Search className="h-6 w-6" />,
  "general-help": <MessageCircle className="h-6 w-6" />,
  warnings: <AlertTriangle className="h-6 w-6" />,
};

const ForumIndex = () => {
  const { data: categories, isLoading, error } = useForumCategories();

  return (
    <PublicLayout>
      <div className="container py-12">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Community Forum
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect with the Ibiza trade community. Share recommendations, ask questions, and help others.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-40">
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-6 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load forum categories.</p>
          </div>
        )}

        {/* Categories grid */}
        {categories && categories.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.id} to={`/forum/${category.slug}`}>
                <Card className="h-full transition-all hover:shadow-soft hover:border-primary/20 cursor-pointer group">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {category.icon ? (
                        <span className="text-2xl">{category.icon}</span>
                      ) : (
                        categoryIconMap[category.slug] || <MessageCircle className="h-6 w-6" />
                      )}
                    </div>
                    <CardTitle className="font-display text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{category.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {categories && categories.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No forum categories available yet.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default ForumIndex;
