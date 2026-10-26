import type { ShellLanguage } from '../shared/shell-preferences';
import { SHARED_EN_COPY } from './shared-copy';
import { DATE_EN_COPY, DATE_ZH_COPY } from './date-copy';
import { ZH_COPY } from './zh-copy';
export const EMPTY_COPY: Readonly<Record<string,string>> = Object.freeze({});
export const CONTEXTUAL_ZH_COPY: Readonly<Record<string,Readonly<Record<string,string>>>> = {
  'Hồ sơ': {'Case':'工单','Profile':'个人资料'},
  'Cập nhật mới nhất': {'Most recently updated':'最近更新优先','Refresh':'刷新'},
  // The same Vietnamese label is used by putaway and audit/history screens.
  // The English context is the stable discriminator; data identifiers stay untouched.
  'Mã lệnh': {'Command ID':'命令 ID'},
  'Phiếu đã ghi sổ': {'Posted receipts':'已过账收货单','Posted outbounds':'已过账出库单'},
};
/** Pure shared translator for hooks and deferred toast callbacks. Data stays data. */
export function translateUiCopy<Value>(source:Value,english:Readonly<Record<string,string>>=EMPTY_COPY,language:ShellLanguage='vi',values?:Readonly<Record<string,string|number>>):Value {
  if(typeof source!=='string')return source;
  const englishValue=english[source]??DATE_EN_COPY[source]??SHARED_EN_COPY[source];
  const translated=language==='en'?englishValue??source:language==='zh-CN'?(englishValue?CONTEXTUAL_ZH_COPY[source]?.[englishValue]:undefined)??DATE_ZH_COPY[source]??ZH_COPY[source]??source:source;
  return (values?translated.replace(/\{(\w+)\}/g,(match,key:string)=>key in values?String(values[key]):match):translated) as Value;
}
