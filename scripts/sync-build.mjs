import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const docsDir = 'docs';
const rootAssetsDir = 'assets';

// 1. Ensure dist/.nojekyll exists
fs.writeFileSync(path.join(distDir, '.nojekyll'), '# disable jekyll');

// 2. Find main JS and CSS bundles
const assetsInDist = fs.readdirSync(path.join(distDir, 'assets'));
const jsBundle = assetsInDist.find((f) => f.startsWith('index-') && f.endsWith('.js'));
const cssBundle = assetsInDist.find((f) => f.startsWith('index-') && f.endsWith('.css'));

if (jsBundle) {
  fs.copyFileSync(
    path.join(distDir, 'assets', jsBundle),
    path.join(distDir, 'assets', 'index-latest.js')
  );
}

if (cssBundle) {
  fs.copyFileSync(
    path.join(distDir, 'assets', cssBundle),
    path.join(distDir, 'assets', 'index-latest.css')
  );
}

// 3. Create 404.html from index.html in dist
const distIndex = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
fs.writeFileSync(path.join(distDir, '404.html'), distIndex);

// 4. Mirror dist to docs/
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
fs.cpSync(distDir, docsDir, { recursive: true });

// 5. Mirror assets to root assets/
if (!fs.existsSync(rootAssetsDir)) fs.mkdirSync(rootAssetsDir, { recursive: true });
fs.cpSync(path.join(distDir, 'assets'), rootAssetsDir, { recursive: true });

// 6. Mirror sw.js and 404.html to root
if (fs.existsSync(path.join(distDir, 'sw.js'))) {
  fs.copyFileSync(path.join(distDir, 'sw.js'), 'sw.js');
}
fs.writeFileSync('404.html', distIndex);

console.log('Build sync completed: dist/, docs/, root assets/ and sw.js are up to date!');
