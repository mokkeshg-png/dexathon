import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Plus, Sparkles, Tag } from "lucide-react";
import {
  ALL_TAXONOMY_SKILLS,
  POPULAR_RECOMMENDED_SKILLS,
  SKILL_CATEGORIES,
} from "@/lib/taxonomies";
import { fetchSkillsFromDB } from "@/lib/supabase-db";
import type { Proficiency, UserSkill } from "@/types";

interface SkillSelectorProps {
  /** Can be either UserSkill[] or simple string[] */
  value: (UserSkill | string)[];
  onChange: (skills: any[]) => void;
  withProficiency?: boolean;
  placeholder?: string;
  maxSkills?: number;
  label?: string;
  helperText?: string;
  allowCustom?: boolean;
}

export function SkillSelector({
  value = [],
  onChange,
  withProficiency = true,
  placeholder = "Search skills, e.g. Python, React, Machine Learning...",
  maxSkills = 30,
  label,
  helperText,
  allowCustom = true,
}: SkillSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dbSkills, setDbSkills] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize selected skills list
  const normalizedSelected = useMemo(() => {
    return value.map((item) => {
      if (typeof item === "string") {
        return { skill: item, proficiency: "intermediate" as Proficiency };
      }
      return item;
    });
  }, [value]);

  const selectedNamesSet = useMemo(() => {
    return new Set(normalizedSelected.map((s) => s.skill.toLowerCase().trim()));
  }, [normalizedSelected]);

  // Load database skills on mount and merge with taxonomies
  useEffect(() => {
    let cancelled = false;
    fetchSkillsFromDB()
      .then((res) => {
        if (!cancelled && res?.length) {
          setDbSkills(res);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Combined master catalog of unique normalized skill names
  const allAvailableSkills = useMemo(() => {
    const set = new Set<string>();
    // Pre-populate with our rich taxonomies
    ALL_TAXONOMY_SKILLS.forEach((s) => set.add(s));
    // Add DB skills
    dbSkills.forEach((s) => set.add(s));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dbSkills]);

  // Filter suggestions based on query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Return popular unselected skills
      return POPULAR_RECOMMENDED_SKILLS.filter(
        (s) => !selectedNamesSet.has(s.toLowerCase())
      ).slice(0, 8);
    }

    return allAvailableSkills
      .filter((s) => {
        if (selectedNamesSet.has(s.toLowerCase())) return false;
        return s.toLowerCase().includes(q);
      })
      .slice(0, 10);
  }, [query, allAvailableSkills, selectedNamesSet]);

  // Find category for a given skill
  const getCategoryForSkill = (skill: string) => {
    for (const [cat, skills] of Object.entries(SKILL_CATEGORIES)) {
      if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        return cat;
      }
    }
    return "Technical";
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSkill = (skillName: string, prof: Proficiency = "intermediate") => {
    const clean = skillName.trim();
    if (!clean) return;
    if (selectedNamesSet.has(clean.toLowerCase())) return;
    if (normalizedSelected.length >= maxSkills) return;

    // Check if original value was string[] or UserSkill[]
    const isStringArray = value.length > 0 && typeof value[0] === "string";

    if (isStringArray || !withProficiency) {
      onChange([...(value as string[]), clean]);
    } else {
      onChange([...normalizedSelected, { skill: clean, proficiency: prof }]);
    }

    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeSkill = (skillName: string) => {
    const isStringArray = value.length > 0 && typeof value[0] === "string";
    if (isStringArray || !withProficiency) {
      onChange((value as string[]).filter((s) => s.toLowerCase() !== skillName.toLowerCase()));
    } else {
      onChange(normalizedSelected.filter((s) => s.skill.toLowerCase() !== skillName.toLowerCase()));
    }
  };

  const updateProficiency = (skillName: string, newProf: Proficiency) => {
    if (!withProficiency) return;
    const updated = normalizedSelected.map((s) =>
      s.skill.toLowerCase() === skillName.toLowerCase() ? { ...s, proficiency: newProf } : s
    );
    onChange(updated);
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
        addSkill(suggestions[highlightedIndex]);
      } else if (query.trim() && allowCustom) {
        // Add custom
        addSkill(query.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Backspace" && !query && normalizedSelected.length > 0) {
      // Remove last skill
      const last = normalizedSelected[normalizedSelected.length - 1];
      removeSkill(last.skill);
    }
  };

  const exactMatchExists = allAvailableSkills.some(
    (s) => s.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div className="w-full space-y-2.5" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-ink">
            {label}
            {maxSkills && (
              <span className="ml-2 text-xs font-normal text-ink-400">
                ({normalizedSelected.length}/{maxSkills})
              </span>
            )}
          </label>
          {withProficiency && (
            <span className="text-xs text-ink-400 hidden sm:inline">
              Click proficiency badge to toggle level
            </span>
          )}
        </div>
      )}

      {/* Selected skill chips display */}
      {normalizedSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2.5 bg-paper-50 rounded-xl border border-ink-100 min-h-[46px]">
          {normalizedSelected.map((item) => {
            const prof = item.proficiency || "intermediate";
            return (
              <span
                key={item.skill}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink shadow-xs transition-all hover:border-navy-300"
              >
                <Tag className="h-3 w-3 text-navy-500" />
                <span className="font-semibold text-ink-800">{item.skill}</span>

                {withProficiency && (
                  <button
                    type="button"
                    onClick={() => {
                      const cycle: Record<Proficiency, Proficiency> = {
                        beginner: "intermediate",
                        intermediate: "advanced",
                        advanced: "beginner",
                      };
                      updateProficiency(item.skill, cycle[prof]);
                    }}
                    title="Click to cycle: Beginner → Intermediate → Advanced"
                    className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      prof === "advanced"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : prof === "intermediate"
                        ? "bg-navy-100 text-navy-800 hover:bg-navy-200"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    }`}
                  >
                    {prof}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeSkill(item.skill)}
                  className="ml-1 rounded p-0.5 text-ink-400 hover:bg-red-50 hover:text-red-700 transition-colors"
                  aria-label={`Remove ${item.skill}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search Input Box */}
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
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-ink-400 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 transition-all shadow-xs"
            disabled={normalizedSelected.length >= maxSkills}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink"
              aria-label="Clear query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-ink-100 bg-white p-2 shadow-lift">
            {suggestions.length > 0 ? (
              <div className="space-y-1">
                <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center justify-between">
                  <span>{query ? "Suggested Skills" : "Popular Skills to Add"}</span>
                  <span className="text-[10px] font-normal lowercase">Press enter to select</span>
                </div>
                {suggestions.map((skill, index) => {
                  const isHighlighted = index === highlightedIndex;
                  const cat = getCategoryForSkill(skill);

                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isHighlighted ? "bg-navy-50 text-navy-900" : "text-ink hover:bg-paper-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5 text-navy-600" />
                        <span className="font-medium">{skill}</span>
                      </div>
                      <span className="rounded bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600">
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* If query has no exact match, allow adding as custom skill */}
            {query.trim() && !exactMatchExists && allowCustom && (
              <div className="mt-1 border-t border-ink-100 pt-1">
                <button
                  type="button"
                  onClick={() => addSkill(query.trim())}
                  className="flex w-full items-center gap-2 rounded-lg bg-navy/5 px-3 py-2 text-left text-sm text-navy hover:bg-navy/10 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-brass" />
                  <span>
                    Add custom skill: <strong className="font-semibold">"{query.trim()}"</strong>
                  </span>
                </button>
              </div>
            )}

            {suggestions.length === 0 && !query.trim() && (
              <div className="py-4 text-center text-xs text-ink-400">
                Type any skill name to search or add custom skill
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Suggestions when nothing selected or minimal selection */}
      {normalizedSelected.length === 0 && (
        <div className="pt-1">
          <p className="text-xs text-ink-500 mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-brass" />
            Quick suggestions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_RECOMMENDED_SKILLS.slice(0, 7).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSkill(s)}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-ink-200 bg-white px-2 py-1 text-xs text-ink-700 hover:border-navy hover:text-navy hover:bg-navy-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {helperText && <p className="text-xs text-ink-400">{helperText}</p>}
    </div>
  );
}
