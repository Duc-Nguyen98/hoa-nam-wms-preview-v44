import {useState} from 'react';
import {DatePicker,DateRangePicker} from './DatePicker';
import {GlobalShell} from './GlobalShell';
import {S00_SHELL_NAVIGATION} from './s00-navigation';
import {useUiCopy} from '../i18n/use-ui-copy';
import {getBusinessDateWindow,validateBusinessDate,validateBusinessDateRange} from './date-policy';
import {Button} from './primitives';
/** Isolated controlled inputs exercise the actual Shared components; no repository writes. */
export function DatePolicyQaScreen() {
  const tx=useUiCopy();
  const [single,setSingle]=useState<string|null>(()=>new URLSearchParams(window.location.search).get('date'));
  const [range,setRange]=useState<{from:string;to:string}|null>(()=>{const q=new URLSearchParams(window.location.search);return q.has('from')||q.has('to')?{from:q.get('from')??'',to:q.get('to')??''}:null;});
  const [changes,setChanges]=useState(0);
  const windowNow=getBusinessDateWindow();
  return <GlobalShell title="QA · Date Policy" variant="wms" navigation={S00_SHELL_NAVIGATION}>
    <section className="hn-date-policy-qa"><h1>QA · Date Policy</h1>
      <p>Shared components · Asia/Ho_Chi_Minh · {windowNow.minDate} → {windowNow.maxDate}</p>
      <DatePicker id="qa-single-date" label={tx('Chọn ngày')} value={single} onChange={value=>{setSingle(value);setChanges(count=>count+1);}}/>
      <DateRangePicker id="qa-date-range" label={tx('Chọn khoảng ngày')} value={range} onChange={value=>{setRange(value);setChanges(count=>count+1);}}/>
      <output data-qa-date-state>{JSON.stringify({single,range,changes,singleValidation:validateBusinessDate(single).code,rangeValidation:validateBusinessDateRange(range).code})}</output>
      <Button variant="secondary" onClick={()=>{setSingle(null);setRange(null);setChanges(0);}}>{tx('Đặt lại')}</Button>
    </section>
  </GlobalShell>;
}
