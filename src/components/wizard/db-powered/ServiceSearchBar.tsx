/**
 * ServiceSearchBar - Universal search across taxonomy with smart depth detection
 * 
 * Determines which wizard step to start at based on query specificity:
 * - Category match → Step 1/2 (Subcategory)
 * - Subcategory match → Step 2 (Micro)
 * - Micro match → Step 3/4 (Questions)
 * - Job-like signals + match → Step 4 (Questions) with extracted data
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, Loader2, Tag, Folder, Wrench, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

export type SearchDepth = 'category' | 'subcategory' | 'micro' | 'questions';

export interface SearchResult {
  depth: SearchDepth;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  microId: string;
  microName: string;
  microSlug: string;
  hasPack: boolean;
  // Optional extracted signals for job-like queries
  extracted?: {
    locationText?: string;
    urgency?: 'asap' | 'this_week' | 'flexible';
    budgetText?: string;
  };
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

// Detect job-like signals in query
function detectJobSignals(query: string): {
  hasSignals: boolean;
  urgency?: 'asap' | 'this_week' | 'flexible';
  locationText?: string;
} {
  const lower = query.toLowerCase();
  
  // Urgency detection
  let urgency: 'asap' | 'this_week' | 'flexible' | undefined;
  if (/urgent|asap|emergency|today|now/.test(lower)) {
    urgency = 'asap';
  } else if (/this week|next few days|soon/.test(lower)) {
    urgency = 'this_week';
  }
  
  // Location detection (Ibiza-specific)
  const locationPatterns = [
    'ibiza', 'eivissa', 'san antonio', 'sant antoni', 'santa eulalia',
    'san jose', 'playa den bossa', 'portinatx', 'jesus', 'talamanca',
    'cala llonga', 'es cubells', 'san rafael', 'ibiza town'
  ];
  let locationText: string | undefined;
  for (const loc of locationPatterns) {
    if (lower.includes(loc)) {
      locationText = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }
  
  // Job-like intent signals
  const intentPatterns = /need|looking for|want|quote|price|how much|help with|fix|repair|install|replace/;
  const hasNumbers = /\d+/.test(query);
  const hasIntentWords = intentPatterns.test(lower);
  
  const hasSignals = !!(urgency || locationText || hasIntentWords || hasNumbers);
  
  return { hasSignals, urgency, locationText };
}

// Determine search depth based on result type and query signals
function determineDepth(
  matchType: 'category' | 'subcategory' | 'micro',
  hasJobSignals: boolean
): SearchDepth {
  // If job signals detected and we have at least a subcategory match, go to questions
  if (hasJobSignals && matchType !== 'category') {
    return 'questions';
  }
  
  // Otherwise, map match type to appropriate step
  switch (matchType) {
    case 'category':
      return 'category'; // Will start at subcategory step
    case 'subcategory':
      return 'subcategory'; // Will start at micro step
    case 'micro':
      return 'micro'; // Will start at questions step
    default:
      return 'micro';
  }
}

// Depth display config
const DEPTH_CONFIG: Record<SearchDepth, { icon: React.ReactNode; label: string; color: string }> = {
  category: { icon: <Folder className="h-3 w-3" />, label: 'Category', color: 'bg-blue-500/10 text-blue-600' },
  subcategory: { icon: <Tag className="h-3 w-3" />, label: 'Service', color: 'bg-purple-500/10 text-purple-600' },
  micro: { icon: <Wrench className="h-3 w-3" />, label: 'Task', color: 'bg-green-500/10 text-green-600' },
  questions: { icon: <FileText className="h-3 w-3" />, label: 'Job Request', color: 'bg-primary/10 text-primary' },
};

export function ServiceSearchBar({ 
  onSelect, 
  placeholder = "Search for a service (e.g., underfloor heating, need painter ASAP)..." 
}: ServiceSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Detect job signals
  const jobSignals = useMemo(() => 
    detectJobSignals(debouncedQuery), 
    [debouncedQuery]
  );

  // Query the search index
  const { data: results, isLoading } = useQuery({
    queryKey: ['service-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      // Build search pattern - split words for flexible matching
      const words = debouncedQuery.toLowerCase().trim().split(/\s+/)
        .filter(w => w.length >= 2 && !['need', 'want', 'looking', 'for', 'the', 'a', 'an', 'my'].includes(w));
      
      if (words.length === 0) return [];
      
      const pattern = `%${words.join('%')}%`;

      const { data, error } = await supabase
        .from('service_search_index')
        .select('*')
        .ilike('search_text', pattern)
        .limit(15);

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      // Sort by relevance: exact matches > prefix matches > contains
      const sorted = (data || []).sort((a, b) => {
        const queryLower = words[0];
        const aName = a.micro_name.toLowerCase();
        const bName = b.micro_name.toLowerCase();
        
        // Exact match on micro name
        const aExact = aName === queryLower;
        const bExact = bName === queryLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Prefix match on micro name
        const aPrefix = aName.startsWith(queryLower);
        const bPrefix = bName.startsWith(queryLower);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;
        
        // Has question pack (ready)
        if (a.has_pack && !b.has_pack) return -1;
        if (!a.has_pack && b.has_pack) return 1;
        
        return aName.localeCompare(bName);
      });

      // Determine match type and depth for each result
      return sorted.map(row => {
        // Determine if this is a category, subcategory, or micro level match
        let matchType: 'category' | 'subcategory' | 'micro' = 'micro';
        
        // Check what level the query matched
        const queryLower = words.join(' ');
        if (row.category_name.toLowerCase().includes(queryLower)) {
          matchType = 'category';
        } else if (row.subcategory_name.toLowerCase().includes(queryLower)) {
          matchType = 'subcategory';
        }
        
        const depth = determineDepth(matchType, jobSignals.hasSignals);
        
        return {
          depth,
          categoryId: row.category_id,
          categoryName: row.category_name,
          subcategoryId: row.subcategory_id,
          subcategoryName: row.subcategory_name,
          microId: row.micro_id,
          microName: row.micro_name,
          microSlug: row.micro_slug,
          hasPack: row.has_pack,
          extracted: jobSignals.hasSignals ? {
            urgency: jobSignals.urgency,
            locationText: jobSignals.locationText,
          } : undefined,
        } as SearchResult;
      });
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Group results by depth for display
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
          <CommandList className="max-h-[50vh] md:max-h-[300px] overflow-y-auto">
            {!hasResults && !isLoading && (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No services found for "{debouncedQuery}"
              </CommandEmpty>
            )}

            {/* Show job signals detected banner */}
            {jobSignals.hasSignals && hasResults && (
              <div className="px-3 py-2 border-b border-border bg-primary/5">
                <p className="text-xs text-primary flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  We detected a job request — we'll skip ahead to save you time
                  {jobSignals.urgency && <Badge variant="secondary" className="ml-1 text-xs">{jobSignals.urgency}</Badge>}
                  {jobSignals.locationText && <Badge variant="secondary" className="ml-1 text-xs">{jobSignals.locationText}</Badge>}
                </p>
              </div>
            )}

            {Object.entries(groupedResults).map(([category, items]) => (
              <CommandGroup key={category} heading={category} className="px-2">
                {items.map((result) => (
                  <CommandItem
                    key={`${result.microId}-${result.depth}`}
                    value={result.microSlug}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2 px-3 py-3 md:py-2 cursor-pointer rounded-md hover:bg-accent min-h-[48px] md:min-h-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <span className="truncate">{result.categoryName}</span>
                        <ChevronRight className="h-3 w-3 shrink-0" />
                        <span className="truncate">{result.subcategoryName}</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {result.microName}
                      </span>
                    </div>
                    
                    {/* Depth badge */}
                    <Badge 
                      variant="secondary" 
                      className={`text-xs gap-1 shrink-0 ${DEPTH_CONFIG[result.depth].color}`}
                    >
                      {DEPTH_CONFIG[result.depth].icon}
                      {DEPTH_CONFIG[result.depth].label}
                    </Badge>
                    
                    {result.hasPack && result.depth === 'micro' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
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
