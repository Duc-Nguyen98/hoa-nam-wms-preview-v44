import {createRoot} from 'react-dom/client';
import {NotificationBell} from '../../../src/notifications/NotificationBell';
import '../../../src/shared/styles.css';
import '../../../src/shared/unified.css';
import '../../../src/shared/components.css';
import '../../../src/shared/premium.css';
import '../../../src/shared/s00-shell.css';
import '../../../src/notifications/notifications.css';
import '../../../src/shared/header-controls.css';
import '../../../src/shared/dark-theme.css';
import '../../../src/shared/premium-dark.css';
import '../../../src/shared/preview-ui.css';
// Actual component and production style cascade. Count input is a test fixture.
createRoot(document.getElementById('root')!).render(<div className="hn-shell" data-shell-version="s00" data-variant="wms" data-layout="desktop"><section style={{padding:48,display:'flex',gap:40,flexWrap:'wrap'}}>{[0,1,9,10,99,100,999].map(count=><div key={count} data-count={count}><div className="hn-header__account"><NotificationBell label="Thông báo" unread={count}/></div><p>{count}</p></div>)}</section></div>);
