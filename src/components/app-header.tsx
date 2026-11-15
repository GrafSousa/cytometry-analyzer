import { FlaskIcon, LockIcon } from "@/components/icons";
import { APP } from "@/config";
import { ptBR } from "@/messages/pt-br";

export function AppHeader() {
  return (
    <header data-slot="app-header" className="pa-header">
      <div className="pa-header__inner">
        <div className="pa-brand">
          <div className="pa-brand__mark">
            <FlaskIcon />
          </div>
          <div>
            <span className="pa-brand__name">{APP.name}</span>
            <span className="pa-brand__sub">{APP.tagline}</span>
          </div>
        </div>
        <div className="pa-privacy">
          <LockIcon size={16} />
          <span>{ptBR.header.privacy}</span>
        </div>
      </div>
    </header>
  );
}
