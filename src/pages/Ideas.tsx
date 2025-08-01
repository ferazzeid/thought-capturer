import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { Settings } from '@/components/Settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { IdeaCard } from '@/components/IdeaCard';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { TimeFilter, getTimeFilterPredicate } from '@/utils/timeFilters';
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

const TIME_PERIODS: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
];

export default function Ideas() {
  const { user, isLoading } = useSupabaseAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

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

  // Filter ideas based on time
  const filteredIdeas = ideas.filter(idea => {
    if (timeFilter === 'all') return true;
    const timeFilterPredicate = getTimeFilterPredicate(timeFilter);
    return timeFilterPredicate(new Date(idea.created_at));
  });

  const toggleTimeFilter = (period: TimeFilter) => {
    setTimeFilter(current => current === period ? 'all' : period);
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
        
        <div className="p-4">
          {/* Simple time filter buttons */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {TIME_PERIODS.map((period) => (
                <Button
                  key={period.value}
                  variant={timeFilter === period.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTimeFilter(period.value)}
                  className="text-xs px-3 py-1 h-8 rounded-lg"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Ideas list */}
          <div className="space-y-3">
            {isLoadingIdeas ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">
                  {timeFilter === 'all' ? 'No ideas yet' : `No ideas from ${TIME_PERIODS.find(p => p.value === timeFilter)?.label.toLowerCase()}`}
                </p>
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
          </div>
        </div>
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