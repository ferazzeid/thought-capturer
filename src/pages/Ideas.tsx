import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/components/SupabaseAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/Header';
import { Settings } from '@/components/Settings';
import { Navigation } from '@/components/Navigation';
import { useProfile } from '@/hooks/useProfile';
import { Bot, Lightbulb, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CategoryPicker } from '@/components/CategoryPicker';
import { useCategories } from '@/hooks/useCategories';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Idea {
  id: string;
  content: string;
  original_audio_transcription: string | null;
  ai_response: string | null;
  created_at: string;
  category_id: string | null;
  parent_recording_id: string | null;
  idea_sequence: number;
  tags: string[];
}

const Ideas = () => {
  const { user, isLoading } = useSupabaseAuth();
  const { profile } = useProfile();
  const [showSettings, setShowSettings] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<Idea | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const { categories } = useCategories();
  const { toast } = useToast();

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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ideas:', error);
        toast({
          title: "Error",
          description: "Failed to load ideas. Please try again.",
          variant: "destructive"
        });
      } else {
        setIdeas(data || []);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  const handleDeleteClick = (idea: Idea) => {
    setIdeaToDelete(idea);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ideaToDelete) return;

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaToDelete.id);

      if (error) {
        console.error('Error deleting idea:', error);
        toast({
          title: "Error",
          description: "Failed to delete idea. Please try again.",
          variant: "destructive"
        });
      } else {
        setIdeas(ideas.filter(idea => idea.id !== ideaToDelete.id));
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

  const filteredIdeas = ideas.filter(idea => {
    const categoryMatch = selectedCategoryFilter === 'all' || 
      (selectedCategoryFilter === 'uncategorized' && !idea.category_id) ||
      idea.category_id === selectedCategoryFilter;
    
    const tagMatch = selectedTagFilter === 'all' || 
      (idea.tags && idea.tags.includes(selectedTagFilter));
    
    return categoryMatch && tagMatch;
  });

  const allTags = [...new Set(ideas.flatMap(idea => idea.tags || []))].sort();

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategoryFilter(categoryId || 'uncategorized');
    setSelectedTagFilter('all');
  };

  const handleTagClick = (tag: string) => {
    setSelectedTagFilter(tag);
    setSelectedCategoryFilter('all');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header 
        onOpenSettings={() => setShowSettings(true)}
        hasApiKey={!!profile?.api_key}
      />
      <Navigation />
      
      <main className="pb-safe">
        <div className="flex flex-col h-full max-w-md mx-auto bg-gradient-subtle">
          <Card className="flex-1 m-4 mb-2 shadow-soft">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Your Ideas</h2>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                    <SelectTrigger className="w-32 h-8">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="uncategorized">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedTagFilter} onValueChange={setSelectedTagFilter}>
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue placeholder="Tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {allTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          #{tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredIdeas.length} of {ideas.length} ideas
              </p>
            </div>
            
            <ScrollArea className="h-[60vh]">
              {isLoadingIdeas ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : ideas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <Lightbulb className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No ideas saved yet</p>
                  <p className="text-sm text-muted-foreground">Start recording to capture your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {filteredIdeas.map((idea) => {
                    const ideaCategory = categories.find(cat => cat.id === idea.category_id);
                    
                    return (
                      <div key={idea.id} className="space-y-3">
                        {/* User Idea */}
                        <div className="flex justify-start">
                          <div className="bg-background border border-border rounded-lg p-4 w-full relative group">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <p className="text-foreground text-sm break-words">
                                  {idea.content}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {ideaCategory && (
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs px-2 py-1 bg-blue-500 text-white hover:bg-blue-600 border-0 cursor-pointer"
                                      onClick={() => handleCategoryClick(ideaCategory.id)}
                                    >
                                      {ideaCategory.name}
                                    </Badge>
                                  )}
                                  {idea.tags && idea.tags.map((tag) => (
                                    <Badge 
                                      key={tag}
                                      variant="secondary" 
                                      className="text-xs px-2 py-1 bg-gray-500 text-white hover:bg-gray-600 border-0 cursor-pointer"
                                      onClick={() => handleTagClick(tag)}
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                                  <CategoryPicker
                                    selectedCategoryId={idea.category_id}
                                    onCategorySelect={(categoryId) => updateIdeaCategory(idea.id, categoryId)}
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-muted-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        {!ideaCategory && (
                                          <span className="text-xs">+ Category</span>
                                        )}
                                      </Button>
                                    }
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(idea)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-secondary"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* AI Response */}
                        {idea.ai_response && (
                          <div className="flex justify-start ml-6">
                            <div className="bg-secondary rounded-lg p-3 max-w-[80%]">
                              <div className="flex items-start space-x-2">
                                <Bot className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <p className="text-secondary-foreground text-sm break-words">
                                  {idea.ai_response}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </main>

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Idea</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this idea? This action cannot be undone.
              {ideaToDelete && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  "{ideaToDelete.content.substring(0, 100)}{ideaToDelete.content.length > 100 ? '...' : ''}"
                </div>
              )}
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
};

export default Ideas;