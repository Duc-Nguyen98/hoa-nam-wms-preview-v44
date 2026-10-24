import { IS_BROWSER_PREVIEW } from '../preview-mode';
import { useUiCopy } from '../i18n/use-ui-copy';
import './preview-mode.css';

const copy = {
  'Thông tin bản dựng': 'Build information',
};
export function PreviewModeNotice({ authentication = false }: { authentication?: boolean }) {
  const tx = useUiCopy(copy);
  if (!IS_BROWSER_PREVIEW) return null;
  // Technical disclosure lives in release.html; do not insert a banner into auth forms.
  if (authentication) return null;
  return <a className="hn-preview-build-link" href="./release.html" target="_blank" rel="noopener">{tx('Thông tin bản dựng')}</a>;
}
