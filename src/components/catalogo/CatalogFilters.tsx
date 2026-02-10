"use client";

import { motion } from "framer-motion";

type CatalogFiltersProps = {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
};

export default function CatalogFilters({
  categories,
  activeCategory,
  onChange,
}: CatalogFiltersProps) {
  return (
    <div className="flex w-full justify-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/80 p-2 shadow-lg shadow-black/5 backdrop-blur">
        {categories.map((category) => {
          const isActive = category === activeCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className="relative px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
            >
              {isActive && (
                <motion.span
                  layoutId="activeCategory"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span
                className={`relative z-10 ${
                  isActive ? "text-white" : "text-secondary"
                }`}
              >
                {category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
