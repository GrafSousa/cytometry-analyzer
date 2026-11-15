import { UploadButton } from "@/components/upload-area";
import { ptBR } from "@/messages/pt-br";

type BatchActionsProps = {
  cacheSize: number;
  onFiles: (files: File[]) => void;
  onClearResults: () => void;
  onClearCache: () => void;
};

/** What the user can do once a batch is done. */
export function BatchActions({
  cacheSize,
  onFiles,
  onClearResults,
  onClearCache,
}: BatchActionsProps) {
  const copy = ptBR.actions;
  return (
    <>
      <UploadButton onFiles={onFiles} />
      <button type="button" className="pa-button pa-button--secondary" onClick={onClearResults}>
        {copy.clearResults}
      </button>
      {cacheSize > 0 && (
        <button
          type="button"
          className="pa-button pa-button--ghost"
          onClick={onClearCache}
          title={copy.cacheSize(cacheSize)}
        >
          {copy.clearCache}
        </button>
      )}
    </>
  );
}
