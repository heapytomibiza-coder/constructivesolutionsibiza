/**
 * ServiceSearchBar - Universal search across taxonomy
 * Allows users to search for any service and skip directly to questions
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

export interface SearchResult {
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  microId: string;
  microName: string;
  microSlug: string;
  hasPack: boolean;
}

interface ServiceSearchBarProps {
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useMemo(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function ServiceSearchBar({ 
  onSelect, 
  placeholder = "Search for a service (e.g., underfloor heating)..." 
}: ServiceSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Query the search index
  const { data: results, isLoading } = useQuery({
    queryKey: ['service-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      // Build search pattern - split words for flexible matching
      const words = debouncedQuery.toLowerCase().trim().split(/\s+/);
      const pattern = `%${words.join('%')}%`;

      const { data, error } = await supabase
        .from('service_search_index')
        .select('*')
        .ilike('search_text', pattern)
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      // Sort by relevance: exact prefix matches first
      const sorted = (data || []).sort((a, b) => {
        const aExact = a.micro_name.toLowerCase().startsWith(debouncedQuery.toLowerCase());
        const bExact = b.micro_name.toLowerCase().startsWith(debouncedQuery.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.micro_name.localeCompare(b.micro_name);
      });

      return sorted.map(row => ({
        categoryId: row.category_id,
        categoryName: row.category_name,
        subcategoryId: row.subcategory_id,
        subcategoryName: row.subcategory_name,
        microId: row.micro_id,
        microName: row.micro_name,
        microSlug: row.micro_slug,
        hasPack: row.has_pack,
      }));
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Group results by category for display
  const groupedResults = useMemo(() => {
    if (!results || results.length === 0) return {};

    return results.reduce((acc, result) => {
      const key = result.categoryName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
  }, [results]);

  const handleSelect = useCallback((result: SearchResult) => {
    setSearchQuery('');
    onSelect(result);
  }, [onSelect]);

  const showResults = debouncedQuery.length >= 2;
  const hasResults = results && results.length > 0;

  return (
    <div className="relative">
      <Command className="border border-border rounded-lg bg-card shadow-sm" shouldFilter={false}>
        <div className="flex items-center px-3 border-b border-border">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {showResults && (
          <CommandList className="max-h-[300px] overflow-y-auto">
            {!hasResults && !isLoading && (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No services found for "{debouncedQuery}"
              </CommandEmpty>
            )}

            {Object.entries(groupedResults).map(([category, items]) => (
              <CommandGroup key={category} heading={category} className="px-2">
                {items.map((result) => (
                  <CommandItem
                    key={result.microId}
                    value={result.microSlug}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md hover:bg-accent"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <span>{result.categoryName}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>{result.subcategoryName}</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {result.microName}
                      </span>
                    </div>
                    {result.hasPack && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        )}
      </Command>
    </div>
  );
}

export default ServiceSearchBar;
