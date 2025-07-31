import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  user_id: string | null;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (name: string, color: string = '#6366f1') => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, color, is_default: false }])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return null;
      }

      setCategories(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Pick<Category, 'name' | 'color'>>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        return null;
      }

      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      return null;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        return false;
      }

      setCategories(prev => prev.filter(cat => cat.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  };
};