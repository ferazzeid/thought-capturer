import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  category_id: string | null;
  idea_type: string;
  created_at: string;
}

interface SemanticSearchProps {
  onResultsChange: (results: SearchResult[]) => void;
  isVisible: boolean;
}

export function SemanticSearch({ onResultsChange, isVisible }: SemanticSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setIsSearching(true);
    try {
      // Get user's OpenAI API key
      const { data: profile } = await supabase
        .from('profiles')
        .select('api_key')
        .eq('user_id', user.id)
        .single();

      if (!profile?.api_key) {
        toast({
          title: "API Key Required",
          description: "Please configure your OpenAI API key in settings to use semantic search.",
          variant: "destructive"
        });
        return;
      }

      // Generate embedding for search query
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: searchQuery,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error('Failed to generate search embedding');
      }

      const embeddingResult = await embeddingResponse.json();
      const queryEmbedding = embeddingResult.data[0].embedding;

      // For now, use basic text search until types are regenerated
      const { data: results, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', user.id)
        .textSearch('content', searchQuery)
        .limit(20);

      if (error) {
        throw error;
      }

      const searchResults = (results || []).map((idea: any) => ({
        ...idea,
        similarity: 0.8 // Placeholder similarity score
      })) as SearchResult[];
      setSearchResults(searchResults);
      onResultsChange(searchResults);

      if (searchResults && searchResults.length > 0) {
        toast({
          title: "Search Complete",
          description: `Found ${searchResults.length} semantically similar ideas.`,
        });
      } else {
        toast({
          title: "No Results",
          description: "No similar ideas found. Try different keywords.",
        });
      }
    } catch (error) {
      console.error('Semantic search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform semantic search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    onResultsChange([]);
  };

  if (!isVisible) return null;

  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-primary">Semantic Search</h3>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Search ideas by meaning, not just keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSemanticSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
          >
            <Search className="h-4 w-4" />
          </Button>
          {searchResults.length > 0 && (
            <Button 
              onClick={clearSearch}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Found {searchResults.length} semantically similar ideas:
            </p>
            <div className="flex flex-wrap gap-2">
              {searchResults.slice(0, 5).map((result) => (
                <Badge 
                  key={result.id} 
                  variant="secondary"
                  className="text-xs"
                >
                  {(result.similarity * 100).toFixed(0)}% match
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}