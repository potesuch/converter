let mode = 'image';
const input = document.getElementById('fileInput');
const drop = document.getElementById('drop');
const progress = document.getElementById('progress');
const bar = document.getElementById('bar');
const status = document.getElementById('status');

document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    mode = tab.dataset.type;
    status.textContent = 'Ready';
  };
});

drop.onclick = () => input.click();
drop.ondragover = e => { e.preventDefault(); };
drop.ondrop = e => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
};
input.onchange = e => handleFiles(e.target.files);

function fakeProgress() {
  progress.style.display = 'block';
  bar.style.width = '0%';
  let p = 0;
  const i = setInterval(() => {
    p += Math.random() * 15;
    bar.style.width = Math.min(p, 95) + '%';
    if (p >= 95) clearInterval(i);
  }, 200);
  return () => bar.style.width = '100%';
}

function handleFiles(files) {
  if (!files.length) return;
  status.textContent = 'Processing…';
  const done = fakeProgress();

  setTimeout(async () => {
    for (const file of files) {
      if (mode === 'image') convertImage(file);
      if (mode === 'pdf') convertPDF(file);
      if (mode === 'audio') convertAudio(file);
    }
    done();
    status.textContent = 'Done';
  }, 1200);
}

function convertImage(file) {
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      c.toBlob(b => download(b, file.name.replace(/\.\w+$/, '.png')), 'image/png');
    };
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
}

async function convertPDF(file) {
  if (file.type !== 'application/pdf') return;
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1);
  const v = page.getViewport({ scale: 2 });
  const c = document.createElement('canvas');
  c.width = v.width;
  c.height = v.height;
  await page.render({ canvasContext: c.getContext('2d'), viewport: v }).promise;
  c.toBlob(b => download(b, 'page-1.png'), 'image/png');
}

async function convertAudio(file) {
  const ctx = new AudioContext();
  const buf = await ctx.decodeAudioData(await file.arrayBuffer());
  const wav = audioBufferToWav(buf);
  download(wav, file.name.replace(/\.\w+$/, '.wav'));
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

function audioBufferToWav(buffer) {
  const l = buffer.length * 2;
  const b = new ArrayBuffer(44 + l);
  const v = new DataView(b);
  let o = 0;
  const w = s => [...s].forEach(c => v.setUint8(o++, c.charCodeAt(0)));
  w('RIFF'); v.setUint32(o, 36 + l, true); o += 4;
  w('WAVEfmt '); v.setUint32(o, 16, true); o += 4;
  v.setUint16(o, 1, true); o += 2;
  v.setUint16(o, 1, true); o += 2;
  v.setUint32(o, buffer.sampleRate, true); o += 4;
  v.setUint32(o, buffer.sampleRate * 2, true); o += 4;
  v.setUint16(o, 2, true); o += 2;
  v.setUint16(o, 16, true); o += 2;
  w('data'); v.setUint32(o, l, true); o += 4;
  const d = buffer.getChannelData(0);
  for (let i = 0; i < d.length; i++, o += 2) {
    v.setInt16(o, Math.max(-1, Math.min(1, d[i])) * 0x7fff, true);
  }
  return new Blob([v], { type: 'audio/wav' });
}

const desc = document.getElementById('tabDesc');

const descriptions = {
  image: 'Convert JPG, PNG and WEBP images to high‑quality PNG files using your browser.',
  pdf: 'Convert PDF documents to images. Each page is rendered locally without uploads.',
  audio: 'Convert audio files to WAV format using browser audio processing.'
};

document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    mode = tab.dataset.type;
    desc.textContent = descriptions[mode];
    status.textContent = 'Ready';
  };
});
