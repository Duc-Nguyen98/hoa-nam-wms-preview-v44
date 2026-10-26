import authCopy from '../data/fixtures/S07.copy.json';
import sessionCopy from '../data/fixtures/S08.copy.json';
import type { AuthCopy } from '../features/S07/auth-contract';
import type { SessionCopy } from '../features/S08/session-contract';

export const authPresentation: Readonly<AuthCopy> = authCopy.content;
export const sessionPresentation: Readonly<SessionCopy> = { ...sessionCopy.content, layout: authCopy.content };
