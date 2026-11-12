'use client';

import { useId, useState, type DragEvent } from 'react';
import { MAX_FILES } from '../services/processBatch';
import { UploadIcon } from './icons';

interface Props {
  disabled?: boolean;
  /** Versão de uma linha, usada durante o processamento. */
  compact?: boolean;
  onFiles: (files: File[]) => void;
}

/** Área de upload do Design System: input nativo escondido + label como alvo de clique e de arraste. */
export function UploadArea({ disabled, compact, onFiles }: Props) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) onFiles(Array.from(e.dataTransfer.files));
  }

  const className = ['pa-upload', compact && 'pa-upload--compact', dragging && 'is-dragging', disabled && 'is-disabled'].filter(Boolean).join(' ');

  return (
    <div>
      {/* O input vem antes do label para o CSS mostrar o foco do teclado na área. */}
      <input
        id={inputId}
        type="file"
        multiple
        accept=".xls,.xlsx,.csv"
        disabled={disabled}
        className="pa-visually-hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ''; // permite escolher os mesmos arquivos de novo
          if (files.length) onFiles(files);
        }}
      />
      <label
        htmlFor={inputId}
        className={className}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {compact ? (
          <>
            <UploadIcon size={22} />
            <span style={{ fontWeight: 600 }}>{disabled ? 'Aguarde o fim do processamento para enviar novas planilhas' : 'Arraste mais planilhas ou clique para escolher'}</span>
          </>
        ) : (
          <>
            <span className="pa-upload__icon">
              <UploadIcon size={28} />
            </span>
            <span className="pa-upload__title">{dragging ? 'Solte para calcular' : 'Arraste as planilhas para cá'}</span>
            {!dragging && <span className="pa-upload__hint">ou</span>}
            {!dragging && <span className="pa-button pa-button--primary">Escolher arquivos</span>}
            <span className="pa-upload__hint">.xls, .xlsx ou .csv · até {MAX_FILES} arquivos por vez</span>
          </>
        )}
      </label>
    </div>
  );
}

/** Botão que abre o seletor de arquivos (tela de resultados). */
export function UploadButton({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputId = useId();
  return (
    <>
      <input
        id={inputId}
        type="file"
        multiple
        accept=".xls,.xlsx,.csv"
        className="pa-visually-hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onFiles(files);
        }}
      />
      <label htmlFor={inputId} className="pa-button pa-button--primary">
        <UploadIcon size={18} />
        Enviar novas planilhas
      </label>
    </>
  );
}
