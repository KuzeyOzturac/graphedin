import {mkdir,cp,rm,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const name of ['index.html','favicon.svg','src','config.json'])await cp(name,`dist/${name}`,{recursive:true});
await writeFile('dist/.nojekyll','');
console.log('Built static frontend in dist/. Backend and credentials are excluded.');
