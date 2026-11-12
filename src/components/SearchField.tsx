'use client';

import { useId } from 'react';
import { CloseIcon, SearchIcon } from './icons';

interface Props {
  value: string;
  onChange: (value: string) => void;
  shown: number;
  total: number;
}

/** Busca por nome da planilha (Design System: SearchField). Filtra enquanto digita; Esc limpa. */
export function SearchField({ value, onChange, shown, total }: Props) {
  const id = useId();
  const active = value.trim().length > 0;

  return (
    <div className="pa-toolbar">
      <div className="pa-search">
        <label htmlFor={id} className="pa-sr-only">
          Buscar planilha pelo nome
        </label>
        <span className="pa-search__icon">
          <SearchIcon size={18} />
        </span>
        <input
          id={id}
          className="pa-search__input"
          type="search"
          placeholder="Buscar planilha pelo nome"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onChange('');
          }}
        />
        {value && (
          <button type="button" className="pa-search__clear" aria-label="Limpar busca" onClick={() => onChange('')}>
            <CloseIcon size={18} />
          </button>
        )}
      </div>
      {active && (
        <span className="pa-search-count" role="status">
          Mostrando <strong>{shown}</strong> de <strong>{total}</strong> planilhas
        </span>
      )}
    </div>
  );
}

/** Estado vazio quando a busca não encontra nada. */
export function SearchEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="pa-empty">
      <span className="pa-empty__icon">
        <SearchIcon size={24} />
      </span>
      <strong>Nenhuma planilha com “{query.trim()}”</strong>
      <span style={{ fontSize: 14 }}>Confira o nome ou busque só uma parte dele, como “48h” ou “exp1”.</span>
      <button type="button" className="pa-button pa-button--secondary" style={{ marginTop: 6 }} onClick={onClear}>
        Limpar busca
      </button>
    </div>
  );
}
