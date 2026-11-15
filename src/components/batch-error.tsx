import { AlertIcon } from "@/components/icons";
import { ptBR } from "@/messages/pt-br";

export function BatchError({ message }: { message: string }) {
  return (
    <div data-slot="batch-error" role="alert" className="pa-alert pa-alert--danger">
      <AlertIcon />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span className="pa-alert__title">{ptBR.batch.errorTitle}</span>
        <span className="pa-alert__text">{message}</span>
      </div>
    </div>
  );
}
