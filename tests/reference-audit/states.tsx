import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PageState} from '../../src/shared/PageState';
import {ReadState} from '../../src/shared/ReadState';
import {InitialReadState} from '../../src/shared/InitialReadState';
import {DataTable} from '../../src/shared/DataTable';
import {Button} from '../../src/shared/primitives';
import '../../src/shared/styles.css';import '../../src/shared/unified.css';import '../../src/shared/components.css';import '../../src/shared/premium.css';import '../../src/shared/dark-theme.css';import '../../src/shared/premium-dark.css';
function Harness(){const [events,setEvents]=useState<string[]>([]);const action=(key:string)=>()=>setEvents(x=>[...x,key]);return <main className="hn-shell" data-screen="states" style={{display:'block',padding:32}}><div className="state-board" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:28}}>
<PageState kind="empty" description="Danh sách hiện chưa có bản ghi nào." action={<Button onClick={action('refresh')}>Đọc lại dữ liệu</Button>}/>
<PageState kind="no-results" description="Không tìm thấy dữ liệu phù hợp." action={<Button onClick={action('reset')}>Xóa bộ lọc</Button>}/>
<PageState kind="error" onRetry={action('retry')}/>
<PageState kind="loading"/>
<PageState kind="forbidden" action={<Button onClick={action('close')}>Đóng</Button>}/>
<PageState kind="record-not-found" action={<Button onClick={action('back')}>Quay lại danh sách</Button>}/>
</div><output data-state-events>{events.join(',')}</output><section data-table-empty><DataTable caption="Danh sách trống" columns={[{id:'name',heading:'Tên',render:(r:string)=>r}]} rows={[]} rowKey={r=>r} emptyContent={<p>Chưa có dữ liệu được ghi nhận.</p>}/></section><section data-read-forbidden><ReadState loading={false} error="FORBIDDEN" hasData={false} loadingText="Đang đọc" errorText="Bạn không có quyền xem dữ liệu này."/></section><section data-initial-forbidden><InitialReadState label="danh sách" loading={false} error={{code:'FORBIDDEN'}}/></section><section data-refresh-preserved><ReadState loading={true} hasData={true} error={null} loadingText="Đang đọc lại" errorText={null}/><p>Dữ liệu đã đọc vẫn hiển thị</p></section></main>}
createRoot(document.getElementById('root')!).render(<Harness/>);
