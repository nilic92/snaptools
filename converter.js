// Shared client-side image converter engine.
// Everything runs in the browser — files never leave the user's device.
//
// Usage on a tool page:
//   initConverter({ outputMime: 'image/jpeg', outputExt: 'jpg', accept: 'image/*,.heic,.heif' });

function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function isHeic(file) {
  const n = file.name.toLowerCase();
  return file.type === 'image/heic' || file.type === 'image/heif' ||
         n.endsWith('.heic') || n.endsWith('.heif');
}

// Decode any input file into an HTMLImageElement (bitmap source).
async function decodeToImage(file, quality) {
  let blob = file;
  if (isHeic(file)) {
    // heic2any is loaded via CDN on HEIC tool pages.
    if (typeof heic2any !== 'function') {
      throw new Error('HEIC support not loaded');
    }
    blob = await heic2any({ blob: file, toType: 'image/png' });
    if (Array.isArray(blob)) blob = blob[0];
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Could not read image'));
      im.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertFile(file, outputMime, quality) {
  const img = await decodeToImage(file, quality);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  // White background for formats without alpha (JPEG).
  if (outputMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Conversion failed — format may be unsupported by your browser'))),
      outputMime,
      quality
    );
  });
  return blob;
}

function initConverter(cfg) {
  const dz = document.getElementById('dropzone');
  const input = document.getElementById('fileInput');
  const results = document.getElementById('results');
  const qualityInput = document.getElementById('quality');
  const qualityVal = document.getElementById('qualityVal');
  const downloadAllBtn = document.getElementById('downloadAll');

  const produced = []; // {name, blob, url}

  if (qualityInput && qualityVal) {
    const sync = () => (qualityVal.textContent = qualityInput.value + '%');
    qualityInput.addEventListener('input', sync);
    sync();
  }

  function newName(file) {
    const base = file.name.replace(/\.[^.]+$/, '');
    return base + '.' + cfg.outputExt;
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/') || isHeic(f)
    );
    for (const file of files) {
      const row = document.createElement('div');
      row.className = 'result-row';
      row.innerHTML =
        '<img alt=""><div class="meta"><div class="name"></div>' +
        '<div class="size"></div></div><div class="status">converting…</div>';
      results.appendChild(row);
      row.querySelector('.name').textContent = newName(file);
      try {
        const quality = qualityInput ? Number(qualityInput.value) / 100 : 0.92;
        const blob = await convertFile(file, cfg.outputMime, quality);
        const url = URL.createObjectURL(blob);
        produced.push({ name: newName(file), url });
        const a = document.createElement('a');
        a.href = url;
        a.download = newName(file);
        a.className = 'btn';
        a.textContent = 'Download';
        a.style.fontSize = '13px';
        a.style.padding = '6px 12px';
        row.querySelector('img').src = url;
        row.querySelector('.size').textContent =
          humanSize(file.size) + ' → ' + humanSize(blob.size);
        const status = row.querySelector('.status');
        status.replaceWith(a);
        if (downloadAllBtn) downloadAllBtn.disabled = false;
      } catch (err) {
        row.querySelector('.status').textContent = '⚠ ' + err.message;
        row.querySelector('.status').style.color = '#ff7676';
      }
    }
  }

  dz.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => handleFiles(e.target.files));
  ['dragenter', 'dragover'].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      dz.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      dz.classList.remove('drag');
    })
  );
  dz.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));

  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', () => {
      produced.forEach((p, i) => {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = p.url;
          a.download = p.name;
          a.click();
        }, i * 150);
      });
    });
  }
}
