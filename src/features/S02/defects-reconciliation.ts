import type { DefectDraft, DefectsCommandContext, DefectsCommandTarget, DefectsModel, DefectsQuery } from '../../contracts/defects';
import type { createDefectsRuntimeController } from '../../controllers/defects-runtime';

export interface DefectsFormSnapshot {
  kind: 'form';
  mode: 'add' | 'edit';
  draft: DefectDraft;
  original: DefectDraft;
  context?: DefectsCommandContext;
  target?: DefectsCommandTarget;
}
export type DefectsReconciliationResult =
  | { kind: 'ready'; model: DefectsModel; candidate: DefectsFormSnapshot }
  | { kind: 'blocked'; reason: 'READ_FAILED' | 'SUPERSEDED' | 'CONTEXT_UNAVAILABLE' | 'TARGET_UNAVAILABLE' | 'TARGET_NOT_VISIBLE'; model?: DefectsModel };

/** Read only. The caller must explicitly discard its retained draft before adopting candidate. */
export async function loadDefectsReconciliation(controller: ReturnType<typeof createDefectsRuntimeController>,
  query: DefectsQuery, form: Readonly<DefectsFormSnapshot>, scenario = 'default'): Promise<DefectsReconciliationResult> {
  try {
    const result = await controller.load(structuredClone(query), scenario);
    if (controller.getSnapshot() !== result) return { kind: 'blocked', reason: 'SUPERSEDED' };
    if (result.kind !== 'ready') return { kind: 'blocked', reason: 'READ_FAILED' };
    const model = result.model, context = model.commandContext;
    if (!context) return { kind: 'blocked', reason: 'CONTEXT_UNAVAILABLE', model };
    let draft: DefectDraft = { code: '', name: '', description: '', status: 'active' };
    let target: DefectsCommandTarget | undefined;
    if (form.mode === 'edit') {
      // Match only the persisted ID; neither code nor render key establishes identity.
      const entry = Object.entries(context.records).find(([, value]) => value.entityId === form.target?.entityId);
      if (!entry) return { kind: 'blocked', reason: 'TARGET_UNAVAILABLE', model };
      const row = model.rows.find(value => value.key === entry[0]);
      if (!row) return { kind: 'blocked', reason: 'TARGET_NOT_VISIBLE', model };
      draft = { code: row.code, name: row.name, description: row.description, status: row.status };
      target = structuredClone(entry[1]);
    }
    return { kind: 'ready', model, candidate: { kind: 'form', mode: form.mode, draft,
      original: structuredClone(draft), context: structuredClone(context), target } };
  } catch {
    return { kind: 'blocked', reason: 'READ_FAILED' };
  }
}
