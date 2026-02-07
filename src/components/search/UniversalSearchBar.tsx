import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Search, Wrench, MessageSquare, ArrowRight } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SearchDepth = "category" | "subcategory" | "micro";

interface ServiceResult {
  type: "service";
  id: string;
  title: string;
  subtitle: string;
  depth: SearchDepth;
  microSlug?: string;
  categoryId?: string;
  subcategoryId?: string;
}

interface ForumResult {
  type: "forum";
  id: string;
  title: string;
  subtitle: string;
  categorySlug: string;
  replyCount: number;
}

type UniversalSearchResult = ServiceResult | ForumResult;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function UniversalSearchBar({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Query services
  const { data: serviceResults = [] } = useQuery({
    queryKey: ["universal-search", "services", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("service_search_index")
        .select("*")
        .ilike("search_text", `%${debouncedQuery}%`)
        .limit(5);

      if (error) throw error;

      // Dedupe and map results
      const seen = new Set<string>();
      const results: ServiceResult[] = [];

      for (const row of data || []) {
        // Prefer micro-level results
        if (row.micro_id && row.micro_name && !seen.has(`micro-${row.micro_id}`)) {
          seen.add(`micro-${row.micro_id}`);
          results.push({
            type: "service",
            id: row.micro_id,
            title: row.micro_name,
            subtitle: `${row.category_name} › ${row.subcategory_name}`,
            depth: "micro",
            microSlug: row.micro_slug || undefined,
          });
        } else if (row.subcategory_id && row.subcategory_name && !seen.has(`sub-${row.subcategory_id}`)) {
          seen.add(`sub-${row.subcategory_id}`);
          results.push({
            type: "service",
            id: row.subcategory_id,
            title: row.subcategory_name,
            subtitle: row.category_name || "",
            depth: "subcategory",
            subcategoryId: row.subcategory_id,
          });
        } else if (row.category_id && row.category_name && !seen.has(`cat-${row.category_id}`)) {
          seen.add(`cat-${row.category_id}`);
          results.push({
            type: "service",
            id: row.category_id,
            title: row.category_name,
            subtitle: "",
            depth: "category",
            categoryId: row.category_id,
          });
        }
      }

      return results.slice(0, 5);
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Query forum posts
  const { data: forumResults = [] } = useQuery({
    queryKey: ["universal-search", "forum", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("forum_posts")
        .select(`
          id,
          title,
          reply_count,
          forum_categories!inner(slug, name)
        `)
        .or(`title.ilike.%${debouncedQuery}%,content.ilike.%${debouncedQuery}%`)
        .limit(5);

      if (error) throw error;

      return (data || []).map((post): ForumResult => ({
        type: "forum",
        id: post.id,
        title: post.title,
        subtitle: (post.forum_categories as { name: string })?.name || "",
        categorySlug: (post.forum_categories as { slug: string })?.slug || "",
        replyCount: post.reply_count || 0,
      }));
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  const hasResults = serviceResults.length > 0 || forumResults.length > 0;
  const showEmpty = debouncedQuery.length >= 2 && !hasResults;

  const handleSelect = useCallback(
    (result: UniversalSearchResult) => {
      setIsOpen(false);
      setQuery("");

      if (result.type === "service") {
        const serviceResult = result as ServiceResult;
        if (serviceResult.depth === "micro" && serviceResult.microSlug) {
          navigate(`/post?micro=${serviceResult.microSlug}`);
        } else if (serviceResult.depth === "subcategory" && serviceResult.subcategoryId) {
          navigate(`/post?subcat=${serviceResult.subcategoryId}`);
        } else if (serviceResult.depth === "category" && serviceResult.categoryId) {
          navigate(`/post?cat=${serviceResult.categoryId}`);
        } else {
          navigate("/post");
        }
      } else {
        const forumResult = result as ForumResult;
        navigate(`/forum/${forumResult.categorySlug}/${forumResult.id}`);
      }
    },
    [navigate]
  );

  const depthLabel = (depth: SearchDepth) => {
    switch (depth) {
      case "category":
        return "Category";
      case "subcategory":
        return "Service";
      case "micro":
        return "Task";
    }
  };

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      <Command
        className="rounded-lg border bg-card shadow-lg"
        shouldFilter={false}
      >
        <CommandInput
          placeholder={t("universalSearch.placeholder", "What can we help you find?")}
          value={query}
          onValueChange={setQuery}
          onFocus={() => setIsOpen(true)}
          className="h-14 text-base pr-16"
        />

        {isOpen && (query.length >= 2 || hasResults) && (
          <CommandList className="max-h-80">
            {showEmpty && (
              <CommandEmpty>
                {t("universalSearch.noResults", { query: debouncedQuery })}
              </CommandEmpty>
            )}

            {serviceResults.length > 0 && (
              <CommandGroup heading={t("universalSearch.services")}>
                {serviceResults.map((result) => (
                  <CommandItem
                    key={`service-${result.id}`}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {depthLabel(result.depth)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {serviceResults.length > 0 && forumResults.length > 0 && (
              <CommandSeparator />
            )}

            {forumResults.length > 0 && (
              <CommandGroup heading={t("universalSearch.community")}>
                {forumResults.map((result) => (
                  <CommandItem
                    key={`forum-${result.id}`}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle} •{" "}
                        {t("universalSearch.replies", { count: result.replyCount })}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>

      {/* Keyboard hint - desktop only */}
      <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <kbd className="px-2 py-1 text-xs text-muted-foreground bg-muted rounded border">
          ⌘K
        </kbd>
      </div>
    </div>
  );
}
