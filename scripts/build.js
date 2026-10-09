import {mkdir,cp,rm,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await rm('dist',{recursive:true,force:true});await mkdir('dist/src',{recursive:true});
for(const name of ['favicon.svg','config.json'])await cp(name,`dist/${name}`);
const hashes=new Map();
for(const name of ['model.js','client.js','app.js','style.css']){
  let source=await readFile(`src/${name}`,'utf8');
  for(const [original,hashed]of hashes)source=source.replaceAll(`./${original}`,`./${hashed}`);
  const hash=createHash('sha256').update(source).digest('hex').slice(0,12);
  const filename=name.replace(/\.(js|css)$/,`.${hash}.$1`);hashes.set(name,filename);
  await writeFile(`dist/src/${filename}`,source);
}
let html=await readFile('index.html','utf8');
for(const [original,hashed]of hashes)html=html.replaceAll(`./src/${original}`,`./src/${hashed}`);
await writeFile('dist/index.html',html);await writeFile('dist/.nojekyll','');
console.log('Built frontend with content-hashed assets. Backend and credentials are excluded.');
