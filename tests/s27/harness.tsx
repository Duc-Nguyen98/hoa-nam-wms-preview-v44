import { createRoot } from 'react-dom/client';
import { OperationalAudit } from '../../src/features/S27/OperationalAudit';
import { GlobalShell } from '../../src/shared/GlobalShell';
import { S00_SHELL_NAVIGATION } from '../../src/shared/s00-navigation';
import { GlobalToastProvider } from '../../src/toast/GlobalToastProvider';
import { ShellPreferencesRuntime } from '../../src/shared/ShellPreferencesRuntime';
import { useUiCopy } from '../../src/i18n/use-ui-copy';
import { CataloguePageHeader } from '../../src/shared/Catalogue';
import { auditFixture } from './fixture';
import '../../src/shared/styles.css';
import '../../src/shared/unified.css';
import '../../src/shared/components.css';
import '../../src/shared/premium.css';
import '../../src/shared/header-controls.css';
import '../../src/shared/dark-theme.css';
import '../../src/shared/premium-dark.css';
import '../../src/shared/table-presentation.css';
import '../../src/shared/preview-ui.css';
import '../../src/features/S27/system-audit.css';

const params = new URLSearchParams(location.search);
const qa = { state:params.get('state') ?? 'ready', count:Number(params.get('count') ?? 3), calls:0, snapshot:auditFixture(Number(params.get('count') ?? 3),params.has('long')), pending:[] as (()=>void)[] };
Object.assign(window,{s27qa:qa});
const adapter = {available:true,async read(){
  qa.calls++;
  const state=qa.state;
  if (state === 'loading') await new Promise<void>(resolve=>qa.pending.push(resolve));
  if (state === 'error') throw Object.assign(new Error('READ_FAILED'),{code:'READ_FAILED'});
  if (state === 'forbidden') throw Object.assign(new Error('FORBIDDEN'),{code:'FORBIDDEN'});
  if (state === 'unavailable') throw Object.assign(new Error('COMMAND_UNAVAILABLE'),{code:'COMMAND_UNAVAILABLE'});
  if (state === 'integrity') { const broken=structuredClone(qa.snapshot);broken.auditEvents[0].data={};return broken; }
  const result=state === 'empty' || state === 'missing' ? auditFixture(0) : structuredClone(qa.snapshot);
  result.snapshotRevision=qa.snapshot.snapshotRevision+qa.calls;
  result.token.revision=result.snapshotRevision;
  return result;
}};
function Harness(){const tx=useUiCopy({'Nhật ký hệ thống':'System audit'});return <GlobalShell title={tx('Nhật ký hệ thống')} variant="wms" activeKey="S27" navigation={S00_SHELL_NAVIGATION} profile={{displayName:'Đức Quang',initials:'DQ'}}><div className="hn-catalogue-screen s27-screen" data-screen="S27" data-visual-variant="premium">{params.has('before') && <CataloguePageHeader title="Nhật ký hệ thống" parentLabel="Hệ thống" breadcrumb="Nhật ký hệ thống" description="Theo dõi các sự kiện đã ghi nhận trong phạm vi snapshot được cấp."/>}<OperationalAudit adapter={adapter}/></div></GlobalShell>;}
createRoot(document.getElementById('root')!).render(<ShellPreferencesRuntime><GlobalToastProvider><Harness/></GlobalToastProvider></ShellPreferencesRuntime>);
