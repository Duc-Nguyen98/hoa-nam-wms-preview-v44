import assert from 'node:assert/strict';
import test from 'node:test';
import fixture from '../../src/data/fixtures/S01_SCANNER_PINNED.json';
import { DEFAULT_OVERVIEW_QUERY } from '../../src/contracts/overview';
import { createOverviewFixtureAdapter } from '../../src/data/adapters/overview-fixture-adapter';
import { OVERVIEW_DOCUMENT_SNAPSHOT, readOverviewSourceDocument } from '../../src/data/adapters/overview-document-fixture-adapter';
import { acceptedOverviewDocumentHref } from '../../src/features/S01/overview-document-link';
import { overviewDocumentHref, resolveOverviewDocumentSelection } from '../../src/app/overview-document-route';
import { resolvePreviewRoute } from '../../src/app/registry';

test('all 16 S01 documents link to their exact source, type, lines and quantities', async () => {
  const adapter = createOverviewFixtureAdapter({ searchMatch:'folded-includes', pageSizeOptions:[25] });
  const result = await adapter.read({ ...DEFAULT_OVERVIEW_QUERY, pageSize:25 });
  assert.equal(result.kind,'ready'); if(result.kind !== 'ready') return;
  assert.equal(result.model.rows.length,16);
  for (const row of result.model.rows) {
    const href: string = acceptedOverviewDocumentHref(row,result.model.source)!;
    assert.ok(href);
    const selection = resolveOverviewDocumentSelection(href)!;
    assert.equal(resolvePreviewRoute(href)?.key,row.type === 'inbound' ? 'S12' : 'S15');
    const document = readOverviewSourceDocument(selection.target)!;
    assert.equal(document.id,row.id); assert.equal(document.number,row.number); assert.equal(document.type,row.type);
    assert.equal(document.partner,row.partner); assert.equal(document.warehouse,row.warehouse);
    assert.equal(document.status,row.status); assert.equal(document.day,row.day); assert.equal(document.actor,row.actor);
    assert.equal(document.lines.reduce((total,line)=>total+line.quantity,0),row.quantity);
    assert.deepEqual(document.lines.map(line=>line.serials),fixture.stockDocuments.find(d=>d.id===row.id)!.lines.map(line=>line.serials));
  }
});

test('source reader rejects wrong source/version/type and never falls back to a matching number', () => {
  const source=fixture.stockDocuments.find(row=>row.number==='PN-0011')!;
  const target={screen:'S12' as const,source:'overview' as const,documentId:source.id,snapshotId:OVERVIEW_DOCUMENT_SNAPSHOT};
  assert.equal(readOverviewSourceDocument(target)?.number,'PN-0011');
  assert.equal(readOverviewSourceDocument({...target,documentId:'PN-0011'}),null);
  assert.equal(readOverviewSourceDocument({...target,documentId:'receipt:other-session-PN-0011'}),null);
  assert.equal(readOverviewSourceDocument({...target,screen:'S15'}),null);
  assert.equal(readOverviewSourceDocument({...target,snapshotId:target.snapshotId+'-old'}),null);
  assert.equal(readOverviewSourceDocument(null),null);
  const first=readOverviewSourceDocument(target)!; first.lines[0].serials.splice(0); first.partner='changed';
  assert.equal(readOverviewSourceDocument(target)?.partner,source.partner);
  assert.deepEqual(readOverviewSourceDocument(target)?.lines[0].serials,source.lines[0].serials);
});

test('links require the accepted row identity and snapshot, not just a present target', async () => {
  const result=await createOverviewFixtureAdapter().read(); assert.equal(result.kind,'ready');if(result.kind!=='ready')return;
  const row=result.model.rows[0],source=result.model.source;
  assert.equal(acceptedOverviewDocumentHref({...row,documentTarget:undefined},source),null);
  assert.equal(acceptedOverviewDocumentHref(row,null),null);
  assert.equal(acceptedOverviewDocumentHref(row,{...source,snapshotId:'old'}),null);
  assert.equal(acceptedOverviewDocumentHref({...row,id:'another-document'},source),null);
  assert.equal(acceptedOverviewDocumentHref({...row,type:row.type==='inbound'?'outbound':'inbound'},source),null);
});

test('route parsing decodes once, rejects incomplete/duplicate/foreign params and keeps list routes intact', () => {
  const target={screen:'S15' as const,source:'overview' as const,documentId:'a%2Fb + c',snapshotId:OVERVIEW_DOCUMENT_SNAPSHOT};
  const href=overviewDocumentHref(target);
  assert.deepEqual(resolveOverviewDocumentSelection(href)?.target,target);
  for (const malformed of [href+'&documentId=other',href+'&source=overview',href+'&extra=1',href.replace('source=overview','source=session'),'#/preview/S12?documentId=x','#/preview/S12?']) {
    assert.equal(resolveOverviewDocumentSelection(malformed)?.target,null);
  }
  for (const screen of ['S12','S15']) {
    assert.equal(resolveOverviewDocumentSelection(`#/preview/${screen}`),null);
    assert.equal(resolvePreviewRoute(`#/preview/${screen}`)?.key,screen);
  }
  assert.equal(resolveOverviewDocumentSelection('#/preview/S03?entityId=x'),null);
  assert.equal(resolvePreviewRoute('#/preview/S03?entityId=x')?.key,'S03');
});
