import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {useAccountCenter} from '../account/AccountCenterContext';
import {Button} from '../shared';
import {createPublicDemoSetup} from './public-demo-setup';

export function PublicDemoGate({children}:{children:ReactNode}){
 const account=useAccountCenter(),setup=useMemo(createPublicDemoSetup,[]);
 const [ready,setReady]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(account?.authStatus!=='active'){setReady(false);return()=>{active=false;};}setChecking(true);setup.ready().then(value=>{if(active)setReady(value);}).catch(()=>{if(active)setError('Chưa đọc được dữ liệu Demo. Bấm thử lại.');}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[account?.authStatus,setup]);
 if(account?.authStatus!=='active'||ready)return <>{children}</>;
 return <main id="main-content" className="setup-container setup-gate" style={{maxWidth:760,margin:'8vh auto',padding:32}}><p className="setup-eyebrow">Hoa Nam WMS</p><h1>Bắt đầu phiên làm việc</h1><p>Chuẩn bị dữ liệu mẫu và phiên làm việc riêng trong trình duyệt này để tiếp tục.</p><p className="setup-local-note">Dữ liệu được lưu riêng trong trình duyệt; thao tác không gửi tới kho thật.</p>{checking?<p role="status">Đang chuẩn bị dữ liệu…</p>:<Button loading={busy} onClick={async()=>{if(busy)return;setBusy(true);setError('');try{await setup.initialize();setReady(true);}catch{setError('Chưa hoàn tất khởi tạo. Dữ liệu đã lưu được giữ lại; bấm thử lại để tiếp tục.');}finally{setBusy(false);}}}>{error?'Thử lại':'Tiếp tục'}</Button>}{error&&<p role="alert">{error}</p>}<p><a href="./release.html">Thông tin phiên bản</a></p></main>;
}
