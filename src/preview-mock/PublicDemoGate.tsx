import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {useAccountCenter} from '../account/AccountCenterContext';
import {Button} from '../shared';
import {createPublicDemoSetup} from './public-demo-setup';

export function PublicDemoGate({children}:{children:ReactNode}){
 const account=useAccountCenter(),setup=useMemo(createPublicDemoSetup,[]);
 const [ready,setReady]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(account?.authStatus!=='active'){setReady(false);return()=>{active=false;};}setChecking(true);setup.ready().then(value=>{if(active)setReady(value);}).catch(()=>{if(active)setError('Chưa đọc được dữ liệu Demo. Bấm thử lại.');}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[account?.authStatus,setup]);
 if(account?.authStatus!=='active'||ready)return <>{children}</>;
 return <main id="main-content" className="setup-container" style={{maxWidth:760,margin:'8vh auto',padding:32}}><p>HOA NAM WMS · PUBLIC CANDIDATE B17</p><h1>Chào mừng đến bản Demo</h1><p>Khởi tạo hai SKU mẫu, một nơi nhận và phiên làm việc riêng trong trình duyệt này để thử nhập kho, xuất kho và bảo hành.</p><p>Dữ liệu là dữ liệu thử nghiệm. Các thao tác không gửi tới kho thật.</p>{checking?<p role="status">Đang kiểm tra dữ liệu Demo…</p>:<Button loading={busy} onClick={async()=>{if(busy)return;setBusy(true);setError('');try{await setup.initialize();setReady(true);}catch{setError('Chưa hoàn tất khởi tạo. Dữ liệu đã lưu được giữ lại; bấm thử lại để tiếp tục.');}finally{setBusy(false);}}}>{error?'Thử lại khởi tạo Demo':'Khởi tạo dữ liệu Demo'}</Button>}{error&&<p role="alert">{error}</p>}<p><a href="./release.html">Thông tin phiên bản và hướng dẫn Demo</a></p></main>;
}
