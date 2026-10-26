import { createRoot } from 'react-dom/client';
import { OverviewScreen } from '../../src/features/S01/OverviewScreen';
import { createOverviewController } from '../../src/controllers/overview-controller';
import { createOverviewFixtureAdapter } from '../../src/data/adapters/overview-fixture-adapter';
import { queryOverviewRows } from '../../src/data/adapters/overview-table-query';
import { OVERVIEW_RUNTIME_POLICY } from '../../src/controllers/overview-runtime';
import type { OverviewRow } from '../../src/contracts/overview';
import { GlobalToastProvider } from '../../src/toast/GlobalToastProvider';
import { ShellPreferencesRuntime } from '../../src/shared/ShellPreferencesRuntime';
import '../../src/shared/styles.css';
import '../../src/shared/unified.css';
import '../../src/shared/components.css';
import '../../src/shared/premium.css';
import '../../src/shared/header-controls.css';
import '../../src/shared/dark-theme.css';
import '../../src/shared/premium-dark.css';
import '../../src/shared/table-presentation.css';
import '../../src/shared/preview-ui.css';

// Imported only by this unbundled test entry, never Main or the public build.
const state = new URLSearchParams(location.search).get('state');
const fixture = createOverviewFixtureAdapter({...OVERVIEW_RUNTIME_POLICY,pageSizeOptions:[...OVERVIEW_RUNTIME_POLICY.pageSizeOptions,100]});
const controller = () => createOverviewController({ async read(query) {
  if (state === 'loading') return new Promise(() => undefined);
  if (state === 'error') throw new Error('isolated read rejection');
  const result = await fixture.read({...query!,page:1,pageSize:100});
  if (result.kind !== 'ready') return result;
  const model = result.model;
  const sourceRows: OverviewRow[] = state === 'empty' ? [] : state === 'long' ? Array.from({length:60},(_,i)=>({
    ...model.rows[i%model.rows.length],id:`qa-${i}-${'a'.repeat(240)}`,number:`QA-${i}`,
    actor:'Nguyễn Văn Người Thực Hiện Có Tên Rất Dài '.repeat(5),partner:'Đối tác có tên và địa chỉ rất dài '.repeat(7),
  })) : model.rows;
  if(state === 'missing' && sourceRows[0]) Object.assign(sourceRows[0],{actor:undefined,partner:null,quantity:undefined,quantityUnit:undefined,timeLabel:''});
  const table = queryOverviewRows(sourceRows,query!);
  if (table.kind !== 'ready') throw new Error('invalid QA query');
  model.rows=table.rows; model.query=query!; model.pagination={...table.pagination,pageSizeOptions:OVERVIEW_RUNTIME_POLICY.pageSizeOptions};
  model.attention=sourceRows.filter(row=>row.status==='waiting');
  model.summary={...model.summary,inbound:sourceRows.filter(row=>row.type==='inbound').length,outbound:sourceRows.filter(row=>row.type==='outbound').length,waiting:model.attention.length,posted:sourceRows.filter(row=>row.status==='posted').length};
  model.chart=model.chart.map((bucket,i)=>{const rows=sourceRows.filter(row=>Math.min(3,Math.floor((Number(row.day.slice(-2))-1)/7))===i);return {...bucket,inbound:rows.filter(row=>row.type==='inbound').length,outbound:rows.filter(row=>row.type==='outbound').length};});
  model.source={...model.source,provenance:'QA_SYNTHETIC',snapshotId:'isolated-s01-qa',fixtureRecordCount:sourceRows.length};
  model.emptyReason=!sourceRows.length?'no-documents':!table.rows.length?'no-matches':null;
  return {kind:'ready',model};
}});
createRoot(document.getElementById('root')!).render(<ShellPreferencesRuntime><GlobalToastProvider><OverviewScreen createController={controller}/></GlobalToastProvider></ShellPreferencesRuntime>);
