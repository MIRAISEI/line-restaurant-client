'use client';

import { cn } from '@/lib/utils';

interface Category {
    id: string;
    name: string;
    imageUrl?: string;
}

interface CategorySelectorProps {
    categories: Category[];
    selectedCategory: string | null;
    onSelectCategory: (categoryId: string) => void;
}

export default function CategorySelector({
    categories,
    selectedCategory,
    onSelectCategory,
}: CategorySelectorProps) {
    return (
        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className={cn(
                        "flex-shrink-0 flex flex-col items-center gap-2 group transition-all duration-300",
                        selectedCategory === category.id ? "scale-105" : "opacity-70 hover:opacity-100"
                    )}
                >
                    <div className={cn(
                        "w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-md",
                        selectedCategory === category.id
                            ? "border-primary ring-4 ring-primary/20 scale-105"
                            : "border-transparent group-hover:border-primary/50"
                    )}>
                        {category.imageUrl ? (
                            <img
                                src={category.imageUrl}
                                alt={category.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                                {category.name}
                            </div>
                        )}
                    </div>
                    <span className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        selectedCategory === category.id ? "text-primary font-bold" : "text-muted-foreground"
                    )}>
                        {category.name}
                    </span>
                    {selectedCategory === category.id && (
                        <div className="h-1 w-8 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
                    )}
                </button>
            ))}
        </div>
    );
}
