
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const toHex = n => n.toString(16).padStart(2, '0');
const hex = (r,g,b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
const fromHex = (h) => {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h.trim());
  if(!m) return null;
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
};
const luminance = (r,g,b) => {
  const a = [r,g,b].map(v => {
    v/=255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  });
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
};
const contrastRatio = (rgb1, rgb2) => {
  const L1 = luminance(...rgb1) + 0.05;
  const L2 = luminance(...rgb2) + 0.05;
  return (Math.max(L1,L2) / Math.min(L1,L2)).toFixed(2);
};

function randomHarmoniousPalette(n = 5, lockFirst = false, first = null){
  const baseHue = rand(0,360);
  const palette = [];
  for(let i=0;i<n;i++){
    const h = (baseHue + i* (360/n)) % 360;
    const s = rand(60,85);
    const l = rand(40,65);
    const c = hslToRgb(h/360, s/100, l/100);
    palette.push(hex(...c));
  }
  if(lockFirst && first){
    palette[0] = first;
  }
  return palette;
}


function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1/3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1/3);
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

function renderPalette(colors){
  const el = document.getElementById('palette');
  el.innerHTML = '';
  colors.forEach(c => {
    const sw = document.createElement('button');
    sw.className = 'swatch';
    sw.style.background = c;
    sw.setAttribute('role','listitem');
    sw.setAttribute('aria-label', `Color ${c}`);
    const tag = document.createElement('div');
    tag.className = 'label';
    tag.textContent = c;
    sw.appendChild(tag);
    sw.addEventListener('click', async () => {
      try{
        await navigator.clipboard.writeText(c);
        tag.textContent = 'Copiado ✓';
        setTimeout(()=> tag.textContent = c, 900);
      }catch(_){ /* ignore */ }
    });
    el.appendChild(sw);
  });
}

function generate(){
  const lock = document.getElementById('lock-first').checked;
  const first = document.querySelector('#palette .swatch .label')?.textContent || null;
  const colors = randomHarmoniousPalette(5, lock, first);
  renderPalette(colors);
}

document.addEventListener('DOMContentLoaded', () => {
  
  renderPalette(randomHarmoniousPalette());
  document.getElementById('btn-new').addEventListener('click', generate);
  document.addEventListener('keydown', (e)=>{
    if(e.code === 'Space'){
      e.preventDefault();
      generate();
    }
  });


  const hexInput = document.getElementById('hex');
  const rgbInput = document.getElementById('rgb');
  const preview = document.getElementById('preview');
  const ratioEl = document.getElementById('ratio');
  const textRadios = document.querySelectorAll('input[name="textc"]');

  function syncFromHex(){
    const rgb = fromHex(hexInput.value);
    if(!rgb) return;
    rgbInput.value = rgb.join(', ');
    preview.style.background = hexInput.value;
    updateContrast();
  }
  function syncFromRgb(){
    const parts = rgbInput.value.split(',').map(v => parseInt(v.trim(),10));
    if(parts.length === 3 && parts.every(v => Number.isFinite(v) && v>=0 && v<=255)){
      hexInput.value = hex(...parts);
      preview.style.background = hexInput.value;
      updateContrast();
    }
  }
  function updateContrast(){
    const bg = fromHex(hexInput.value);
    const textColor = [...textRadios].find(r => r.checked).value === 'black' ? [0,0,0] : [255,255,255];
    if(bg){
      const ratio = contrastRatio(bg, textColor);
      ratioEl.textContent = `Contraste: ${ratio}:1`;
    }
  }
  hexInput.addEventListener('input', syncFromHex);
  rgbInput.addEventListener('input', syncFromRgb);
  textRadios.forEach(r => r.addEventListener('change', updateContrast));
  syncFromHex();
});
