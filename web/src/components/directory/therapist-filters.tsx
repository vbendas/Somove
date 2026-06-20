"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface TherapistFiltersProps {
  modalities: string[];
}

export default function TherapistFilters({ modalities }: TherapistFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeModality = searchParams.get("modality") || "";

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={() => setFilter("modality", "")}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          !activeModality
            ? "bg-primary text-primary-foreground"
            : "bg-surface text-warm-gray hover:bg-surface/80"
        }`}
      >
        All
      </button>
      {modalities.map((m) => (
        <button
          key={m}
          onClick={() => setFilter("modality", m)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeModality === m
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-warm-gray hover:bg-surface/80"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
