import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Wrench, MessageSquare, ArrowRight, Layers, FolderOpen } from "lucide-react";
import { VoiceInput } from "@/components/professional/VoiceInput";
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
import { buildSearchOrClause } from "@/features/search/lib/searchSynonyms";
import { txCategory, txMicro, txSubcategory } from "@/i18n/taxonomyTranslations";
import { useGlobalSearchShortcut } from "@/hooks/useGlobalSearchShortcut";
import {
  type SearchHit,
  type ForumHit,
  type UniversalSearchResult,
  buildWizardUrlFromHit,
  buildForumUrl,
  isServiceHit,
  getHitTypeLabelKey,
  getHitBreadcrumb,
} from "./types";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Transform raw DB rows into typed SearchHits
 * INDEPENDENT collection: extracts all 3 entity types from each row (no else-if)
 * This ensures categories + subcategories + micros all appear in results
 */
function transformServiceResults(data: Array<{
  category_id: string | null;
  category_name: string | null;
  subcategory_id: string | null;
  subcategory_name: string | null;
  micro_id: string | null;
  micro_name: string | null;
  micro_slug: string | null;
}>): SearchHit[] {
  const seen = new Set<string>();

  const micros: SearchHit[] = [];
  const subs: SearchHit[] = [];
  const cats: SearchHit[] = [];

  // Separate score buckets to maintain type grouping
  let microScore = 300;
  let subScore = 200;
  let catScore = 100;

  for (const row of data) {
    // 1) Micros (Tasks) - most specific
    if (row.micro_id && row.micro_name) {
      const key = `micro-${row.micro_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        micros.push({
          type: "micro",
          id: row.micro_id,
          label: row.micro_name,
          categoryId: row.category_id || undefined,
          categoryName: row.category_name || undefined,
          subcategoryId: row.subcategory_id || undefined,
          subcategoryName: row.subcategory_name || undefined,
          microSlug: row.micro_slug || undefined,
          score: microScore--,
        });
      }
    }

    // 2) Subcategories (Services) - independently collected
    if (row.subcategory_id && row.subcategory_name) {
      const key = `sub-${row.subcategory_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        subs.push({
          type: "subcategory",
          id: row.subcategory_id,
          label: row.subcategory_name,
          categoryId: row.category_id || undefined,
          categoryName: row.category_name || undefined,
          score: subScore--,
        });
      }
    }

    // 3) Categories (broadest) - independently collected
    if (row.category_id && row.category_name) {
      const key = `cat-${row.category_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        cats.push({
          type: "category",
          id: row.category_id,
          label: row.category_name,
          score: catScore--,
        });
      }
    }
  }

  // Limit each type, then merge (order: tasks first, then services, then categories)
  const topMicros = micros.slice(0, 5);
  const topSubs = subs.slice(0, 3);
  const topCats = cats.slice(0, 3);

  return [...topMicros, ...topSubs, ...topCats];
}

const ROTATING_EXAMPLES_EN = [
  "Fix a leaking tap...",
  "Kitchen renovation...",
  "Electrical rewiring...",
  "Paint my living room...",
  "Install air conditioning...",
  "Build a garden wall...",
  "Pool maintenance...",
  "Fit new windows...",
];

const ROTATING_EXAMPLES_ES = [
  "Reparar un grifo...",
  "Reforma de cocina...",
  "Instalación eléctrica...",
  "Pintar mi salón...",
  "Instalar aire acondicionado...",
  "Construir un muro de jardín...",
  "Mantenimiento de piscina...",
  "Instalar ventanas nuevas...",
];

function useRotatingPlaceholder(examples: string[], intervalMs = 3000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % examples.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [examples.length, intervalMs]);

  return examples[index];
}

export function UniversalSearchBar({ className }: { className?: string }) {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const examples = i18n.language?.startsWith("es") ? ROTATING_EXAMPLES_ES : ROTATING_EXAMPLES_EN;
  const rotatingExample = useRotatingPlaceholder(examples);

  // Global ⌘K / Ctrl+K shortcut
  useGlobalSearchShortcut(() => {
    setIsOpen(true);
    // Use requestAnimationFrame to ensure DOM is ready, then query for input
    requestAnimationFrame(() => {
      const input = rootRef.current?.querySelector("input");
      input?.focus();
    });
  });

  // Escape key closes search
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  // Query services - returns typed SearchHits with synonym expansion + sanitization
  const { data: serviceResults = [] } = useQuery({
    queryKey: ["universal-search", "services", debouncedQuery],
    queryFn: async (): Promise<SearchHit[]> => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      // Build sanitized OR clause with synonym expansion
      const orClause = buildSearchOrClause(debouncedQuery);
      if (!orClause) return [];

      const { data, error } = await supabase
        .from("service_search_index")
        .select("*")
        .or(orClause)
        .limit(20); // Fetch more to ensure variety across types

      if (error) throw error;
      return transformServiceResults(data || []);
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Query forum posts - returns typed ForumHits
  const { data: forumResults = [] } = useQuery({
    queryKey: ["universal-search", "forum", debouncedQuery],
    queryFn: async (): Promise<ForumHit[]> => {
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

      return (data || []).map((post): ForumHit => ({
        type: "forum",
        id: post.id,
        title: post.title,
        categorySlug: (post.forum_categories as { slug: string })?.slug || "",
        categoryName: (post.forum_categories as { name: string })?.name || "",
        replyCount: post.reply_count || 0,
      }));
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  const localizedServiceResults = useMemo(() => {
    return serviceResults.map((hit): SearchHit => {
      if (hit.type === "micro") {
        return {
          ...hit,
          label: txMicro(hit.microSlug, t, hit.label),
          categoryName: txCategory(hit.categoryName, t) ?? hit.categoryName,
          subcategoryName: txSubcategory(hit.subcategoryName, t) ?? hit.subcategoryName,
        };
      }

      if (hit.type === "subcategory") {
        return {
          ...hit,
          label: txSubcategory(hit.label, t) ?? hit.label,
          categoryName: txCategory(hit.categoryName, t) ?? hit.categoryName,
        };
      }

      return {
        ...hit,
        label: txCategory(hit.label, t) ?? hit.label,
      };
    });
  }, [serviceResults, t]);

  // Filter results by type for grouped display
  const taskHits = localizedServiceResults.filter((h) => h.type === "micro");
  const subHits = localizedServiceResults.filter((h) => h.type === "subcategory");
  const catHits = localizedServiceResults.filter((h) => h.type === "category");

  const hasResults = localizedServiceResults.length > 0 || forumResults.length > 0;
  const showEmpty = debouncedQuery.length >= 2 && !hasResults;

  /**
   * Handle result selection - NAVIGATE ONLY, no state mutation
   * The wizard is the only place that resolves URL → state
   */
  const handleSelect = useCallback(
    (result: UniversalSearchResult) => {
      setIsOpen(false);
      setQuery("");

      if (isServiceHit(result)) {
        const url = buildWizardUrlFromHit(result);
        navigate(url);
      } else {
        const url = buildForumUrl(result);
        navigate(url);
      }
    },
    [navigate]
  );

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-2xl mx-auto", className)}>
      <Command
        className="rounded-lg border bg-card shadow-lg"
        shouldFilter={false}
        onKeyDown={handleKeyDown}
      >
        <CommandInput
          placeholder={query ? "" : rotatingExample}
          value={query}
          onValueChange={setQuery}
          onFocus={() => setIsOpen(true)}
          className="h-14 text-base pr-24"
        />

        {isOpen && (query.length >= 2 || hasResults) && (
          <CommandList className="max-h-80">
            {showEmpty && (
              <CommandEmpty>
                {t("universalSearch.noResults", { query: debouncedQuery })}
              </CommandEmpty>
            )}

            {/* Tasks (Micros) - most specific */}
            {taskHits.length > 0 && (
              <CommandGroup heading={t("universalSearch.tasks", "Tasks")}>
                {taskHits.map((hit) => (
                  <CommandItem
                    key={`${hit.type}-${hit.id}`}
                    value={hit.label}
                    onSelect={() => handleSelect(hit)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{hit.label}</p>
                      {getHitBreadcrumb(hit) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {getHitBreadcrumb(hit)}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {t(getHitTypeLabelKey(hit.type), { defaultValue: hit.type })}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Services (Subcategories) */}
            {subHits.length > 0 && (
              <>
                {taskHits.length > 0 && <CommandSeparator />}
                <CommandGroup heading={t("universalSearch.subcategories", "Services")}>
                  {subHits.map((hit) => (
                    <CommandItem
                      key={`${hit.type}-${hit.id}`}
                      value={hit.label}
                      onSelect={() => handleSelect(hit)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/50 text-accent-foreground">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hit.label}</p>
                        {getHitBreadcrumb(hit) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {getHitBreadcrumb(hit)}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {t(getHitTypeLabelKey(hit.type), { defaultValue: hit.type })}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Categories (broadest) */}
            {catHits.length > 0 && (
              <>
                {(taskHits.length > 0 || subHits.length > 0) && <CommandSeparator />}
                <CommandGroup heading={t("universalSearch.categories", "Categories")}>
                  {catHits.map((hit) => (
                    <CommandItem
                      key={`${hit.type}-${hit.id}`}
                      value={hit.label}
                      onSelect={() => handleSelect(hit)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <FolderOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hit.label}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {t(getHitTypeLabelKey(hit.type), { defaultValue: hit.type })}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Forum results */}
            {forumResults.length > 0 && (
              <>
                {(taskHits.length > 0 || subHits.length > 0 || catHits.length > 0) && <CommandSeparator />}
                <CommandGroup heading={t("universalSearch.community", "Community Posts")}>
                  {forumResults.map((hit) => (
                    <CommandItem
                      key={`forum-${hit.id}`}
                      value={hit.title}
                      onSelect={() => handleSelect(hit)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hit.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {hit.categoryName} •{" "}
                          {t("universalSearch.replies", { count: hit.replyCount })}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
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
