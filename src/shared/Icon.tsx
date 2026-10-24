import type { ReactNode, SVGProps } from 'react';

export type IconName = 'save' | 'sun' | 'moon' | 'language' | 'check' | 'eye' | 'eye-off' | 'image' | 'more' | 'barcode' | 'building' | 'menu' | 'close' | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'section' | 'warehouse' | 'brand' | 'home' | 'box' | 'download' | 'upload' | 'tray' | 'shield' | 'chart' | 'history' | 'search' | 'tag' | 'refresh' | 'calendar' | 'help' | 'documents' | 'catalog' | 'users' | 'settings' | 'audit' | 'bell' | 'plus' | 'edit' | 'info' | 'pin' | 'unpin' | 'lock' | 'arrow-right' | 'logout' | 'user' | 'filter' | 'circle-check' | 'alert-triangle' | 'alert-circle' | 'arrow-up' | 'arrow-down' | 'arrows-sort' | 'arrows-horizontal';

/* Original SVG paths authored locally. Semantic functions observed in S01/S02 references; no approved glyph/font asset claim. */
export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
  'check': <>
    <path d="M5 12l5 5l10 -10" />
  </>,
  'language': <>
    <path d="M9 6.371c0 4.418 -2.239 6.629 -5 6.629" />
      <path d="M4 6.371h7" />
      <path d="M5 9c0 2.144 2.252 3.908 6 4" />
      <path d="M12 20l4 -9l4 9" />
      <path d="M19.1 18h-6.2" />
      <path d="M6.694 3l.793 .582" />
  </>,
  'moon': <>
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />
  </>,
  'sun': <>
    <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
  </>,
  'save': <>
    <path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" />
      <path d="M10 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M14 4l0 4l-6 0l0 -4" />
  </>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    'eye-off': <><path d="m3 3 18 18M9 5.5A12 12 0 0 1 12 5c6 0 10 7 10 7a23 23 0 0 1-3 3.8M6 6.5A24 24 0 0 0 2 12s4 7 10 7a12 12 0 0 0 5-1.2" /><path d="M9 10a3 3 0 0 0 4 4" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>,
    more: <><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>,
    barcode: <path d="M3 3v18M7 5v14M10 3v18M14 3v18M17 5v14M21 3v18" />,
    building: <><path d="M3 21V10h7M10 21V3h10v18M2 21h20M6 13v1M6 17v1M14 7h2M14 11h2M14 15h2M14 19h2" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    'chevron-left': <path d="m14 5-7 7 7 7" />,
    'chevron-right': <path d="m10 5 7 7-7 7" />,
    'chevron-down': <path d="m5 9 7 7 7-7" />,
    section: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    warehouse: <><path d="m3 9 9-6 9 6v12H3V9Z" /><path d="M8 21V11h8v10M8 15h8M8 18h8" /></>,
    brand: <><path d="M2 22V9L12 2l10 7v13M5.5 22V11L12 6.5l6.5 4.5v11M9 22v-7h6v7M6 12h12" /></>,
    home: <><path d="m3 11 9-8 9 8M5 9v12h5v-7h4v7h5V9" /></>,
    box: <><path d="m12 3 9 5v10l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v10M7.5 5.5l9 5" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5M4 15v6h16v-6" /></>,
    tray: <><path d="m5 4-3 7v10h20V11l-3-7H5ZM2 11h7v4h6v-4h7M9 18h6" /></>,
    shield: <><path d="M12 3c3 2 6 3 9 3v6c0 5-4 8-9 11-5-3-9-6-9-11V6c3 0 6-1 9-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
    chart: <><path d="M4 21V12h3v9M11 21V7h3v14M18 21V3h3v18" /></>,
    history: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h2M14 15h1M9 19h2M14 19h1" /></>,
    search: <><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></>,
    tag: <><path d="m3 13 10-10h8v8L11 21 3 13Z" /><circle cx="17" cy="7" r="1" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5M19 11a7 7 0 0 0-12-6L4 8M5 13a7 7 0 0 0 12 6l3-3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="17" rx="2" /><path d="M7 2v6M17 2v6M3 11h18" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01" /></>,
    documents: <><path d="M5 2h10l5 5v15H5V2ZM15 2v6h5M8 12h9M8 16h3M14 16h3M8 19h9" /></>,
    catalog: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></>,
    users: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-3c0-4 14-4 14 0v3M17 4a3 3 0 0 1 0 6M18 14c3 0 4 2 4 4v3" /></>,
    settings: <><path d="m9 2-1 3-3 1-3 4 2 2-2 2 3 4 3 1 1 3h6l1-3 3-1 3-4-2-2 2-2-3-4-3-1-1-3H9Z" /><circle cx="12" cy="12" r="4" /></>,
    audit: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 7h8M8 11h8M8 15h8M8 19h5" /></>,
    bell: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 21h4M12 2v2" /></>,
    plus: <path d="M12 4v16M4 12h16" />,
    edit: <><path d="m4 16 12-12a2 2 0 0 1 4 4L8 20l-5 1 1-5ZM14 6l4 4" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    pin: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></>,
    unpin: <circle cx="12" cy="12" r="8" />,
    lock: <><path d="M5 13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6Z" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    'arrow-right': <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    logout: <><path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" /><path d="M9 12h12m-3-3 3 3-3 3" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /></>,
  'filter': <>
    <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227" />
  </>,
  'circle-check': <>
    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
  </>,
  'alert-triangle': <>
    <path d="M12 9v4" />
      <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" />
      <path d="M12 16h.01" />
  </>,
  'alert-circle': <>
    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
  </>,
  'arrow-up': <>
    <path d="M12 5l0 14" />
      <path d="M18 11l-6 -6" />
      <path d="M6 11l6 -6" />
  </>,
  'arrow-down': <>
    <path d="M12 5l0 14" />
      <path d="M18 13l-6 6" />
      <path d="M6 13l6 6" />
  </>,
  'arrows-sort': <>
    <path d="M3 9l4 -4l4 4m-4 -4v14" />
      <path d="M21 15l-4 4l-4 -4m4 4v-14" />
  </>,
  'arrows-horizontal': <>
    <path d="M7 8l-4 4l4 4" />
      <path d="M17 8l4 4l-4 4" />
      <path d="M3 12l18 0" />
  </>,
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}
