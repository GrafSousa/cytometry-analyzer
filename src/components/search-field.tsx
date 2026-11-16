"use client";

import { useId, type KeyboardEvent } from "react";

import { CloseIcon, SearchIcon } from "@/components/icons";
import { ptBR } from "@/messages/pt-br";

const copy = ptBR.search;

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  shown: number;
  total: number;
};

/** Search by spreadsheet name (Design System: SearchField). Filters while typing; Esc clears. */
export function SearchField({ value, onChange, shown, total }: SearchFieldProps) {
  const id = useId();
  const isActive = value.trim().length > 0;

  function clearOnEscape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") onChange("");
  }

  return (
    <div data-slot="search-field" className="pa-toolbar">
      <div className="pa-search">
        <label htmlFor={id} className="pa-sr-only">
          {copy.label}
        </label>
        <span className="pa-search__icon">
          <SearchIcon size={18} />
        </span>
        <input
          id={id}
          className="pa-search__input"
          type="search"
          placeholder={copy.label}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={clearOnEscape}
        />
        {value && (
          <button
            type="button"
            className="pa-search__clear"
            aria-label={copy.clear}
            onClick={() => onChange("")}
          >
            <CloseIcon size={18} />
          </button>
        )}
      </div>
      {isActive && (
        <span className="pa-search-count" role="status">
          {copy.showing} <strong>{shown}</strong> {copy.of} <strong>{total}</strong> {copy.files}
        </span>
      )}
    </div>
  );
}

/** Empty state when the search finds nothing. */
export function SearchEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div data-slot="search-empty" className="pa-empty">
      <span className="pa-empty__icon">
        <SearchIcon size={24} />
      </span>
      <strong>{copy.emptyTitle(query.trim())}</strong>
      <span style={{ fontSize: 14 }}>{copy.emptyHint}</span>
      <button
        type="button"
        className="pa-button pa-button--secondary"
        style={{ marginTop: 6 }}
        onClick={onClear}
      >
        {copy.clear}
      </button>
    </div>
  );
}
