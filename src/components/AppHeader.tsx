import { APP } from '../config';
import { FlaskIcon, LockIcon } from './icons';

export function AppHeader() {
  return (
    <header className="pa-header">
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
          <span>Os arquivos ficam no seu computador</span>
        </div>
      </div>
    </header>
  );
}
