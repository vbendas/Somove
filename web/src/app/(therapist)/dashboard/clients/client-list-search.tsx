"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ClientListSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    router.push(`/dashboard/clients?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray" />
      <Input
        placeholder="Search clients..."
        className="pl-10"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
