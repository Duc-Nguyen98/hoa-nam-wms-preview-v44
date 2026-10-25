import { registerHooks } from 'node:module';
registerHooks({ load(url, context, next) { return url.endsWith('.css') ? { format:'module', source:'export default {};', shortCircuit:true } : next(url,context); } });
