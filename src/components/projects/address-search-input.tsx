"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { AddressSuggestion } from "@models/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MIN_QUERY_LENGTH = 3;

type AddressSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  disabled?: boolean;
};

type AddressSearchResponse = {
  suggestions: AddressSuggestion[];
  message?: string;
};

export function AddressSearchInput({ value, onChange, onSelect, disabled }: AddressSearchInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const debounceRef = useRef<number | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);

  const runLookup = (nextQuery: string) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
    }

    const trimmedQuery = nextQuery.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      requestAbortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/address/search?query=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as AddressSearchResponse;
        if (!response.ok) {
          throw new Error(payload.message ?? "Address lookup failed.");
        }

        setSuggestions(payload.suggestions);
      } catch (lookupError) {
        if ((lookupError as Error).name === "AbortError") {
          return;
        }

        setSuggestions([]);
        setError(lookupError instanceof Error ? lookupError.message : "Address lookup failed.");
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
    };
  }, []);

  const showSuggestions = useMemo(() => {
    return suggestions.length > 0 && value.trim().length >= MIN_QUERY_LENGTH;
  }, [value, suggestions.length]);

  return (
    <div className="relative flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-2 left-2.5 text-muted-foreground" data-icon="inline-start" />
        <Input
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue);
            runLookup(nextValue);
          }}
          className="pl-8"
          placeholder="Search Australian address"
          disabled={disabled}
        />
        {loading ? (
          <Loader2Icon className="absolute top-2 right-2.5 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showSuggestions ? (
        <div className="max-h-56 overflow-y-auto rounded-lg border bg-popover p-1">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              variant="ghost"
              className="h-auto w-full items-start justify-start px-2 py-2 text-left"
              onClick={() => {
                onSelect(suggestion);
                onChange(suggestion.address);
                setSuggestions([]);
              }}
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{suggestion.address}</span>
                <span className="text-xs text-muted-foreground">{suggestion.council}</span>
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
