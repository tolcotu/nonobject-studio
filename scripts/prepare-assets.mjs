import sharp from 'sharp';
const base='/Users/ilastepanenko/.codex/generated_images/01a0d04c-db87-7ca3-b10c-f50254f1cdfc/';
for(const [file,name] of [['exec-db1bb319-08fd-4077-b946-3232133314d7.png','hero-object'],['exec-5237b56e-f3ad-4294-9777-f0043fe11d39.png','blue-study'],['exec-cd92f9ad-6289-49c3-b0df-98be1edf83a3.png','sound-study']]) {
 console.log(name, await sharp(base+file).metadata());
 await sharp(base+file).resize({width:1400,withoutEnlargement:true}).webp({quality:87}).toFile(`public/assets/${name}.webp`);
 await sharp(base+file).resize({width:700,withoutEnlargement:true}).webp({quality:82}).toFile(`public/assets/${name}-small.webp`);
}
