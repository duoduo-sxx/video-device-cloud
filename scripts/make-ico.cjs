/* 将一组 PNG 打包为 ICO（Vista+ 支持 PNG 压缩帧） */
/* 用法: node scripts/make-ico.cjs <out.ico> <img1.png> <img2.png> ... */
const fs = require('node:fs');

const [out, ...images] = process.argv.slice(2);
if (!out || images.length === 0) {
  console.error('用法: node scripts/make-ico.cjs <out.ico> <img1.png> ...');
  process.exit(1);
}

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const frames = images.map((file) => {
  const buf = fs.readFileSync(file);
  const { w, h } = pngSize(buf);
  if (buf.slice(12, 16).toString() !== 'IHDR') throw new Error(`${file} 不是 PNG`);
  return { buf, w, h };
});

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 0 + 2); // type = icon
header.writeUInt16LE(frames.length, 4);

const entries = [];
let offset = 6 + frames.length * 16;
for (const f of frames) {
  const e = Buffer.alloc(16);
  e.writeUInt8(f.w >= 256 ? 0 : f.w, 0);
  e.writeUInt8(f.h >= 256 ? 0 : f.h, 1);
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(f.buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += f.buf.length;
  entries.push(e);
}

fs.writeFileSync(out, Buffer.concat([header, ...entries, ...frames.map((f) => f.buf)]));
console.log(`已生成 ${out}（${frames.length} 帧, ${(fs.statSync(out).size / 1024).toFixed(1)} KB）`);
