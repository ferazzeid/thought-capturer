import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { Settings } from '@/components/Settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CategoryPicker } from '@/components/CategoryPicker';
import { IdeaCard } from '@/components/IdeaCard';
import { useCategories } from '@/hooks/useCategories';
import { useProfile } from '@/hooks/useProfile';
import { Filter, X, Hash, Calendar } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { TimeFilter, TIME_FILTER_OPTIONS, getTimeFilterPredicate } from '@/utils/timeFilters';
import { useSupabaseAuth } from '@/components/SupabaseAuthProvider';

interface Idea {
  id: string;
  content: string;
  ai_response?: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
  tags?: string[];
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

export default function Ideas() {
  const { user, isLoading } = useSupabaseAuth();
  const { profile } = useProfile();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchIdeas();
    }
  }, [user]);

  const fetchIdeas = async () => {
    try {
      setIsLoadingIdeas(true);
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          categories (
            id,
            name,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ideas:', error);
        toast({
          title: "Error",
          description: "Failed to load ideas. Please try again.",
          variant: "destructive"
        });
      } else {
        const ideasWithCategories = data?.map(idea => ({
          ...idea,
          category: idea.categories ? {
            id: idea.categories.id,
            name: idea.categories.name,
            color: idea.categories.color
          } : undefined
        })) || [];
        setIdeas(ideasWithCategories);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setIdeaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ideaToDelete) return;

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaToDelete);

      if (error) {
        console.error('Error deleting idea:', error);
        toast({
          title: "Error",
          description: "Failed to delete idea. Please try again.",
          variant: "destructive"
        });
      } else {
        setIdeas(ideas.filter(idea => idea.id !== ideaToDelete));
        toast({
          title: "Idea deleted",
          description: "Your idea has been removed.",
        });
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
    } finally {
      setDeleteDialogOpen(false);
      setIdeaToDelete(null);
    }
  };

  const updateIdeaCategory = async (ideaId: string, categoryId: string | null) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ category_id: categoryId })
        .eq('id', ideaId);

      if (error) {
        console.error('Error updating idea category:', error);
        toast({
          title: "Error",
          description: "Failed to update category. Please try again.",
          variant: "destructive"
        });
      } else {
        setIdeas(ideas.map(idea => 
          idea.id === ideaId ? { ...idea, category_id: categoryId } : idea
        ));
        const categoryName = categories.find(c => c.id === categoryId)?.name || 'No category';
        toast({
          title: "Category updated",
          description: `Idea moved to "${categoryName}".`,
        });
      }
    } catch (error) {
      console.error('Error updating idea category:', error);
    }
  };

  // Filter ideas based on selected categories, tags, and time
  const filteredIdeas = ideas.filter(idea => {
    // Time filter
    const timeFilterPredicate = getTimeFilterPredicate(timeFilter);
    if (!timeFilterPredicate(new Date(idea.created_at))) {
      return false;
    }
    
    // Category filter
    if (selectedCategories.length > 0) {
      if (!idea.category || !selectedCategories.includes(idea.category.id)) {
        return false;
      }
    }
    
    // Tag filter
    if (selectedTags.length > 0) {
      if (!idea.tags || !selectedTags.some(tag => idea.tags.includes(tag))) {
        return false;
      }
    }
    
    return true;
  });

  // Get all unique tags from ideas
  const allTags = [...new Set(ideas.flatMap(idea => idea.tags || []))].sort();

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-md mx-auto">
        <Header 
          onOpenSettings={() => setShowSettings(true)}
          hasApiKey={!!profile?.api_key}
        />
        <Navigation />
        
        <Card className="m-4 shadow-soft">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg font-semibold">Your Ideas</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(selectedCategories.length > 0 || selectedTags.length > 0 || timeFilter !== 'all') && (
                  <span className="bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {selectedCategories.length + selectedTags.length + (timeFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </Button>
            </div>
            
            {/* Time Filter - Always visible */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Time Period</span>
              </div>
              <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleContent className="space-y-4 pt-4 border-t">
                {/* Category Filters */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={(checked) => toggleCategoryFilter(category.id)}
                          />
                          <label 
                            htmlFor={`category-${category.id}`}
                            className="text-sm cursor-pointer flex items-center gap-1"
                          >
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tag Filters */}
                {allTags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={(checked) => toggleTagFilter(tag)}
                          />
                          <label 
                            htmlFor={`tag-${tag}`}
                            className="text-sm cursor-pointer"
                          >
                            {tag}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                {(selectedCategories.length > 0 || selectedTags.length > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedTags([]);
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoadingIdeas ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No ideas found matching your filters.</p>
              </div>
            ) : (
              filteredIdeas.map((idea) => (
                <IdeaCard 
                  key={idea.id} 
                  idea={idea} 
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Idea</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this idea? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}