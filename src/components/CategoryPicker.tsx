import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCategories, Category } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';

interface CategoryPickerProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string | null) => void;
  trigger?: React.ReactNode;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategoryId,
  onCategorySelect,
  trigger
}) => {
  const { categories, createCategory } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    const category = await createCategory(newCategoryName.trim());
    
    if (category) {
      onCategorySelect(category.id);
      setNewCategoryName('');
      setIsOpen(false);
      toast({
        title: "Category created",
        description: `"${category.name}" has been added to your categories.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive"
      });
    }
    setIsCreating(false);
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="h-6 px-2 text-xs"
    >
      {selectedCategory ? (
        <Badge 
          variant="secondary" 
          className="text-xs px-1 py-0"
          style={{ backgroundColor: selectedCategory.color + '20', color: selectedCategory.color }}
        >
          {selectedCategory.name}
        </Badge>
      ) : (
        <span className="text-muted-foreground">Add category</span>
      )}
    </Button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 space-y-1">
          <div className="text-sm font-medium p-2">Select Category</div>
          
          {selectedCategoryId && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => {
                onCategorySelect(null);
                setIsOpen(false);
              }}
            >
              No category
            </Button>
          )}

          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => {
                onCategorySelect(category.id);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
              </div>
              {selectedCategoryId === category.id && (
                <Check className="h-4 w-4" />
              )}
            </Button>
          ))}

          <div className="border-t pt-2">
            <div className="flex gap-1">
              <Input
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCategory();
                  }
                }}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || isCreating}
                className="h-8 px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};