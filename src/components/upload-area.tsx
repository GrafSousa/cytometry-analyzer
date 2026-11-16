"use client";

import { useId, useState, type ChangeEvent, type DragEvent } from "react";

import { UploadIcon } from "@/components/icons";
import { ptBR } from "@/messages/pt-br";
import { ACCEPTED_EXTENSIONS, MAX_FILES } from "@/services/process-batch";

const copy = ptBR.upload;
const ACCEPT = ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

type FilesHandler = (files: File[]) => void;

type FileInputProps = { id: string; disabled?: boolean; onFiles: FilesHandler };

/** The native file input, hidden; its label is the visible click and drop target. */
function FileInput({ id, disabled, onFiles }: FileInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Cleared so choosing the same files again still fires a change.
    event.target.value = "";
    if (files.length) onFiles(files);
  }

  return (
    <input
      id={id}
      type="file"
      multiple
      accept={ACCEPT}
      disabled={disabled}
      className="pa-visually-hidden"
      onChange={handleChange}
    />
  );
}

function CompactContent({ disabled }: { disabled?: boolean }) {
  return (
    <>
      <UploadIcon size={22} />
      <span style={{ fontWeight: 600 }}>{disabled ? copy.busy : copy.compact}</span>
    </>
  );
}

function FullContent({ isDragging }: { isDragging: boolean }) {
  return (
    <>
      <span className="pa-upload__icon">
        <UploadIcon size={28} />
      </span>
      <span className="pa-upload__title">{isDragging ? copy.drop : copy.title}</span>
      {!isDragging && <span className="pa-upload__hint">{copy.or}</span>}
      {!isDragging && <span className="pa-button pa-button--primary">{copy.choose}</span>}
      <span className="pa-upload__hint">{copy.hint(MAX_FILES)}</span>
    </>
  );
}

type UploadAreaProps = {
  disabled?: boolean;
  /** One-line version, used while a batch is processing. */
  compact?: boolean;
  onFiles: FilesHandler;
};

/** The Design System's upload area: a hidden native input with its label as the drop target. */
export function UploadArea({ disabled, compact, onFiles }: UploadAreaProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) onFiles(Array.from(event.dataTransfer.files));
  }

  const className = [
    "pa-upload",
    compact && "pa-upload--compact",
    isDragging && "is-dragging",
    disabled && "is-disabled",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div data-slot="upload-area">
      {/* The input comes before the label so the CSS can show keyboard focus on the area. */}
      <FileInput id={inputId} disabled={disabled} onFiles={onFiles} />
      <label
        htmlFor={inputId}
        className={className}
        data-dragging={isDragging ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {compact ? <CompactContent disabled={disabled} /> : <FullContent isDragging={isDragging} />}
      </label>
    </div>
  );
}

/** Button that opens the file picker (results screen). */
export function UploadButton({ onFiles }: { onFiles: FilesHandler }) {
  const inputId = useId();
  return (
    <>
      <FileInput id={inputId} onFiles={onFiles} />
      <label data-slot="upload-button" htmlFor={inputId} className="pa-button pa-button--primary">
        <UploadIcon size={18} />
        {copy.sendNew}
      </label>
    </>
  );
}
