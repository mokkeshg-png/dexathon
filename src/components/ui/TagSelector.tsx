import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Plus, Sparkles, Hash } from "lucide-react";

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  availableOptions: string[];
  popularSuggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  label?: string;
  helperText?: string;
  allowCustom?: boolean;
}

export function TagSelector({
  value = [],
  onChange,
  availableOptions = [],
  popularSuggestions = [],
  placeholder = "Search or type new tag...",
  maxTags = 15,
  label,
  helperText,
  allowCustom = true,
}: TagSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(() => new Set(value.map((v) => v.toLowerCase().trim())), [value]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return (popularSuggestions.length ? popularSuggestions : availableOptions)
        .filter((opt) => !selectedSet.has(opt.toLowerCase()))
        .slice(0, 8);
    }
    return availableOptions
      .filter((opt) => !selectedSet.has(opt.toLowerCase()) && opt.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, availableOptions, popularSuggestions, selectedSet]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean || selectedSet.has(clean.toLowerCase()) || value.length >= maxTags) return;
    onChange([...value, clean]);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t.toLowerCase() !== tag.toLowerCase()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev < suggestions.length ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && suggestions[highlightedIndex]) {
        addTag(suggestions[highlightedIndex]);
      } else if (query.trim() && allowCustom) {
        addTag(query.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const exactMatchExists = availableOptions.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="w-full space-y-2" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-ink">
            {label}
            {maxTags && (
              <span className="ml-2 text-xs font-normal text-ink-400">
                ({value.length}/{maxTags})
              </span>
            )}
          </label>
        </div>
      )}

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-paper-50 rounded-xl border border-ink-100 min-h-[40px]">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink shadow-xs"
            >
              <Hash className="h-3 w-3 text-brass-500" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded text-ink-400 hover:text-red-600 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-9 text-sm text-ink placeholder:text-ink-400 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 transition-all shadow-xs"
            disabled={value.length >= maxTags}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 rounded-full p-1 text-ink-400 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-ink-100 bg-white p-2 shadow-lift">
            {suggestions.length > 0 && (
              <div className="space-y-1">
                {suggestions.map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => addTag(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                      idx === highlightedIndex ? "bg-navy-50 text-navy-900" : "text-ink hover:bg-paper-100"
                    }`}
                  >
                    <span className="font-medium">{opt}</span>
                    <Plus className="h-3.5 w-3.5 text-ink-400" />
                  </button>
                ))}
              </div>
            )}

            {query.trim() && !exactMatchExists && allowCustom && (
              <div className="mt-1 border-t border-ink-100 pt-1">
                <button
                  type="button"
                  onClick={() => addTag(query.trim())}
                  className="flex w-full items-center gap-2 rounded-lg bg-navy/5 px-3 py-2 text-left text-sm text-navy hover:bg-navy/10"
                >
                  <Sparkles className="h-3.5 w-3.5 text-brass" />
                  <span>Add "{query.trim()}"</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {helperText && <p className="text-xs text-ink-400">{helperText}</p>}
    </div>
  );
}
