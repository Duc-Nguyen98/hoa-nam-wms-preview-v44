import fs from 'node:fs/promises';
// Publish the complete Vite build, including the visual review, from main/docs.
await fs.cp('dist', 'docs', { recursive: true });
await fs.writeFile('docs/.nojekyll', '');
console.log('GitHub Pages artifact prepared in docs/');
