import { useState } from 'react';
import type { NotificationDocumentSelection } from '../../app/notification-document-route';
import { readNotificationSourceDocument } from '../../data/adapters/notification-document-fixture-adapter';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';
import { Button, CataloguePageHeader, GlobalShell, Icon, PageState, StatusBadge } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { useShellPreferences } from '../../shared/shell-preferences';
import { openRelatedNotification } from '../../notifications/open-notification';
import { copyText } from '../../shared/copy-text';
import './notification-source-document.css';

const copy={
 vi:{back:'Quay lại thông báo',list:'Danh sách nghiệp vụ',info:'Thông tin hồ sơ',copy:'Sao chép mã',copied:'Đã sao chép.',failed:'Không thể sao chép. Vui lòng thử lại.',missing:'Không tìm thấy hồ sơ liên quan',reason:'Liên kết không hợp lệ hoặc hồ sơ không còn trong nguồn dữ liệu đã chọn. Mở lại thông báo để kiểm tra.',title:'Hồ sơ liên quan',note:'Nội dung liên quan'},
 en:{back:'Back to notification',list:'Business list',info:'Record information',copy:'Copy reference',copied:'Copied.',failed:'Unable to copy. Please try again.',missing:'Related record not found',reason:'The link is invalid or the record is no longer in the selected source. Open the notification again.',title:'Related record',note:'Related information'},
 'zh-CN':{back:'返回通知',list:'业务列表',info:'记录信息',copy:'复制编号',copied:'已复制。',failed:'无法复制，请重试。',missing:'未找到关联记录',reason:'链接无效或所选数据源中已无此记录。请重新打开通知。',title:'关联记录',note:'关联信息'}
};
export function NotificationSourceDocumentScreen({selection}:{selection:NotificationDocumentSelection}) {
 const {language}=useShellPreferences(),tx=copy[language];
 const record=IS_BROWSER_PREVIEW?readNotificationSourceDocument(selection.target):null;
 const [feedback,setFeedback]=useState('');
 const title=record?.title[language]??tx.title;
 const status=record?.fields.find(field=>field.tone);
 const back=()=>openRelatedNotification(record?.notificationId);
 return <GlobalShell title={title} activeKey={selection.screen} variant="wms" navigation={S00_SHELL_NAVIGATION}>
  <section className="nsd-screen" data-screen={selection.screen} data-notification-record-id={record?.recordId} data-notification-source-id={record?.notificationId}>
   <CataloguePageHeader appearance="worklist" title={record?`${title} · ${record.reference}`:title} parentLabel={record?.categoryLabel[language]??tx.title} breadcrumb={record?.reference??tx.title} actions={<Button variant="secondary" leadingIcon={<Icon name="chevron-left" size={18}/>} onClick={back}>{tx.back}</Button>}/>
   {!record?<PageState kind="record-not-found" title={tx.missing} description={tx.reason} action={<Button onClick={back}>{tx.back}</Button>}/>:<>
    <section className="nsd-panel" aria-labelledby="nsd-info">
     <header className="nsd-identity"><div><p>{record.categoryLabel[language]}</p><div className="nsd-code"><h2 data-record-reference>{record.reference}</h2><Button iconOnly variant="secondary" aria-label={tx.copy} title={tx.copy} onClick={async()=>{try{await copyText(record.reference);setFeedback(tx.copied);}catch{setFeedback(tx.failed);}}}><Icon name="copy" size={20}/></Button></div></div>{status&&<StatusBadge tone={status.tone??'neutral'}><Icon name={status.tone==='success'?'circle-check':status.tone==='warning'?'alert-circle':'info'} size={16}/>{status.value[language]}</StatusBadge>}</header>
     {feedback&&<p role="status" className="nsd-feedback">{feedback}</p>}
     <h3 id="nsd-info">{tx.info}</h3><dl className="nsd-fields">{record.fields.map((field,index)=><div key={index} data-record-field={index}><dt>{field.label[language]}</dt><dd>{field.value[language]}</dd></div>)}</dl>
    </section>
    <section className="nsd-panel" aria-labelledby="nsd-note"><h3 id="nsd-note">{tx.note}</h3><p className="nsd-description" data-record-description>{record.description[language]}</p></section>
    <div className="nsd-footer"><Button variant="secondary" trailingIcon={<Icon name="chevron-right" size={18}/>} onClick={()=>{window.location.hash=`#/preview/${selection.screen}`;}}>{tx.list}</Button></div>
   </>}
  </section>
 </GlobalShell>;
}
