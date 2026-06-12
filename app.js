/* ════════════════════════════════════════════
   RECEIPT WALL — app.js
   
   Concept, design decisions, colour logic, and 
   interaction design by Jasleen Sandhu.
   
   Code was developed iteratively with assistance 
   from Claude (Anthropic AI), used for generating 
   and debugging implementation code based on my 
   specifications and design direction. All concept,
   research, colour mapping decisions, and interaction
   design choices are my own.
   
   Third-party library: Tesseract.js (OCR)
   https://github.com/naptha/tesseract.js
   ════════════════════════════════════════════ */


// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let allReceipts    = [];
let currentItems   = [];
let currentMeta    = {};
let previewOrdered = false;
let wallOrdered    = false;
let detInterval    = null;
let audioCtx       = null;
let currentTone    = null;

// User-defined colours — self-builds as users assign colours during session
const userColours  = {};
const DEFAULT_COL  = '#888880';

// ════════════════════════════════════════════
// COLOUR TABLES
// ════════════════════════════════════════════

// Colour words found inside a product name e.g. "navy shirt", "red wine"
const CW = {
  navy:'#1F3464',     red:'#D83030',      blue:'#3060B0',     green:'#308040',
  black:'#303030',    white:'#E8E8E8',    pink:'#E870A0',     purple:'#7050A0',
  yellow:'#D8C030',   orange:'#D87030',   grey:'#888888',     gray:'#888888',
  brown:'#806040',    beige:'#D4C090',    cream:'#E8DCC0',    gold:'#C8A830',
  silver:'#B0B8B8',   teal:'#308888',     coral:'#D86050',    khaki:'#A09060',
  olive:'#707030',    maroon:'#801828',   burgundy:'#701828', charcoal:'#404848',
  rose:'#D87080',     mint:'#70C0A0',     lavender:'#9090C0', indigo:'#3030A0',
  amber:'#D49020',    ivory:'#F0ECD8',    cobalt:'#1840A0',   scarlet:'#C02020',
  crimson:'#A01828',  turquoise:'#208888',magenta:'#C02888',  lilac:'#A080C0',
  peach:'#E8A880',    sand:'#D4C090',     slate:'#607080',
};

// Food & product keywords mapped to their natural colour
// ════════════════════════════════════════════
// COLOUR LOOKUP TABLES — original research & design
// Food/product → colour mappings developed through
// my own research into ingredient and product colours
// ════════════════════════════════════════════
const FK = {
  // Fruit & Veg
  strawberr:'#D83858',  blueberr:'#7050B0',   raspberry:'#C03058',
  mango:'#E89030',      broccoli:'#4A9A58',    kale:'#389048',
  spinach:'#2E7040',    carrot:'#D88030',      tomato:'#C83020',
  mushroom:'#907058',   watermelon:'#D85868',  grape:'#883068',
  avocado:'#6A8830',    banana:'#D8C830',      lemon:'#E8D030',
  lime:'#70B030',       potato:'#C8A870',      onion:'#C09060',
  capsicum:'#C83020',   zucchini:'#6A9050',    lettuce:'#80B060',
  corn:'#D8C030',       pea:'#70A840',         bean:'#4A8830',
  beetroot:'#8A1040',   cauliflower:'#E8E8D8', pumpkin:'#D87020',
  ginger:'#D4A050',     garlic:'#E0D8C0',      celery:'#90B860',
  asparagus:'#5A9040',  eggplant:'#502870',    leek:'#88A850',
  chilli:'#C82020',     bok:'#50A060',         cabbage:'#70A848',
  fennel:'#80B880',     radish:'#D03050',      parsnip:'#D8C898',
  silverbeet:'#2E7040', apricot:'#E89050',     peach:'#E8A870',
  plum:'#702868',       pear:'#A0B840',        melon:'#D0C840',
  cherry:'#C02840',     fig:'#883050',         coconut:'#E0D8C8',
  kiwi:'#6A9830',       pomegranate:'#C02030', kit:'#b70012',
  stra: '#D83858'
  // Protein
  chicken:'#D4A050',    beef:'#8A2020',        pork:'#C87858',
  salmon:'#E87858',     tuna:'#6080A0',        lamb:'#A03828',
  turkey:'#B08040',     duck:'#6A3020',        prawn:'#E87858',
  shrimp:'#E87858',     crab:'#C84020',        lobster:'#D04020',
  tofu:'#E8E0C8',       tempeh:'#C8A870',      lentil:'#C89050',
  chickpea:'#D4B880',   mince:'#8A2020',       sausage:'#B06040',
  bacon:'#C06050',      ham:'#D08070',         salami:'#B04040',
  fillet:'#D4A060',     steak:'#8A2020',       schnitzel:'#D4A860',
  // Dairy
  butter:'#E8C840',     cheese:'#E8D890',      milk:'#dae8f3',
  egg:'#D8B858',        yoghurt:'#E8E0C8',     yogurt:'#E8E0C8',
  cream:'#F0EAD8',      kefir:'#E8E0D0',       ghee:'#D8C040',
  // Grains & Pantry
  pasta:'#D4B870',      spaghet:'#D4B870',     noodle:'#D8C878',
  ndls:'#D8C878',       rice:'#E8E4D0',        bread:'#C89058',
  flour:'#E8E4D8',      oat:'#C8A860',         muesli:'#C8A030',
  granola:'#C89838',    quinoa:'#D0C898',       barley:'#C4A858',
  cereal:'#D4A840',     cracker:'#D4B870',     pretzel:'#C8A058',
  sourdough:'#C89058',  roti:'#D4B878',        tortilla:'#D8C890',
  bagel:'#C89850',      croissant:'#D4A840',   pita:'#D8C890',
  sndwch:'#C89058'
  // Drinks
  coffee:'#7A4A20',     tea:'#8A6840',         juice:'#E89030',
  coke:'#C82020',       cola:'#C82020',        water:'#A0C0D8',
  wine:'#5A1828',       beer:'#C8A030',        soy:'#5A3810',
  kombucha:'#A86838',   matcha:'#508840',      chai:'#B87040',
  sprite:'#D0E8C0',     sparkling:'#A0C0D8',
  almond:'#C8A870',     lemonade:'#E8E050',
  // Condiments & Sauces
  sauce:'#6A3010',      oil:'#C8B030',         honey:'#D09818',
  jam:'#C83050',        mustard:'#D4C020',     myo:'#E8E0A8',
  ketchup:'#C82020',    vinegar:'#B09060',     relish:'#A84020',
  pickle:'#789040',     aioli:'#E8E0A0',       hummus:'#D4B880',
  pesto:'#608030',      tahini:'#C8AA70',      miso:'#906040',
  chutney:'#B07840',    vegemite:'#2A1808',    nutella:'#4A2810',
  // Snacks & Sweet
  chip:'#D4B040',       crisp:'#D4B040',       biscuit:'#C8A870',
  snac:'#e5a663',       cookie:'#C89050',      cake:'#E8C898',
  chocolate:'#3A1E10',  choc:'#3A1E10',        berri:'#9050A0',
  berry:'#9050A0',      icecream:'#E8D8C0',    gelato:'#E0D0E8',
  sorbet:'#E8C0C0',     lolly:'#D850A0',       candy:'#E05090',
  gummy:'#E060A0',      caramel:'#C88030',     fudge:'#8A5030',
  brownie:'#4A2810',    muffin:'#C89050',      donut:'#D4A050',
  popcorn:'#E8D080',    nut:'#B87840',         cashew:'#D4B870',
  walnut:'#8A5030',     pistachio:'#8AAA50',   peanut:'#C89050',
  hazelnut:'#8A5030',   macadamia:'#D4C090',   yuzu:'#f5f776',
  // Household
  tissue:'#F0EEE8',     toilet:'#F0EEE8',      towel:'#E8E0D0',
  foil:'#C0C0C0',       sponge:'#D0C050',
  // Personal care
  toothpaste:'#60C0C0', toothbrush:'#4080C0',  razor:'#808890',
  floss:'#A0D0D0',      cotton:'#F0EEE8',      antiseptic:'#D0E8D0',
  sunscreen:'#F0D878',  moisturis:'#D8E0E8',   shampoo:'#D0A0C8',
  conditioner:'#C8D0E8',deodorant:'#A0C0C8',   soap:'#D0C8E8',
  // Frozen
  frozen:'#A0C8D8',
};

// Category fallback — broad groups for anything not in FK
const CAT = [
  { k:['lamp','light','globe','bulb','torch'],                                          c:'#C89040' },
  { k:['shirt','tee','dress','pants','jeans','jacket','hoodie','sock','underwear'],      c:'#9A8878' },
  { k:['table','chair','desk','shelf','sofa','couch','drawer','mattress'],               c:'#C8A878' },
  { k:['cable','charger','phone','screen','keyboard','mouse','battery','headphone'],     c:'#606870' },
  { k:['pen','pencil','notebook','paper','folder','staple','tape','glue'],               c:'#E8E0D0' },
  { k:['shampoo','conditioner','soap','face','deodorant','perfume'],                     c:'#A0C0C8' },
  { k:['spray','cleaner','detergent','bleach','dishwash','laundry'],                     c:'#70B060' },
  { k:['vitamin','tablet','capsule','panadol','bandaid','sunscreen','antacid'],          c:'#D07828' },
  { k:['book','magazine','journal','novel'],                                              c:'#6A4828' },
  { k:['plant','pot','soil','seed','fertiliser'],                                        c:'#4A9048' },
  { k:['candle','diffuser','frame','cushion','vase','rug'],                              c:'#C8A050' },
  { k:['toy','game','puzzle'],                                                            c:'#E05040' },
  { k:['bag','backpack','wallet','purse', 'usb'],                                         c:'#806040' },
  { k:['shoes','boots','sandal','sneakers','thong'],                                        c:'#806040' },
];

// ── Colour lookup — user colours take priority over everything ──
function getColour(name) {
  const n = name.toLowerCase();

  // 1. User-assigned colours (exact or partial keyword match)
  if (userColours[n]) return userColours[n];
  for (const [key, col] of Object.entries(userColours)) {
    if (n.includes(key)) return col;
  }

  // 2. Colour word in the product name (e.g. "navy", "red")
  for (const [w, h] of Object.entries(CW)) if (h && n.includes(w)) return h;

  // 3. Food/product keyword
  for (const [k, h] of Object.entries(FK)) if (n.includes(k)) return h;

  // 4. Category fallback
  for (const cat of CAT) if (cat.k.some(k => n.includes(k))) return cat.c;

  // 5. Default grey — will trigger the colour picker
  return DEFAULT_COL;
}
// Standard RGB to HSL hue conversion
// Common algorithm — adapted from W3C colour conversion formulas
// https://www.w3.org/TR/css-color-3/#hsl-color
function hexToHue(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx - mn;
  if (!d) return 0;
  let h = mx===r ? (g-b)/d%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4;
  return (h * 60 + 360) % 360;
}

// ════════════════════════════════════════════
// SOUND — fixed: stops reliably on mouseleave
// ════════════════════════════════════════════
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Web Audio API oscillator pattern
// Based on standard MDN Web Audio API documentation
// https://developer.mozilla.org/en-US/docs/Web_API/Web_Audio_API
// Frequency mapping (hue → pitch) is my own design decision
function playTone(hex) {
  try {
    ensureAudio();
    stopTone();
    const freq = 160 + (hexToHue(hex) / 360) * 520;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.08);
    osc.start();
    currentTone = { osc, gain };
  } catch(e) {}
}

// Fixed: cancels scheduled ramps before fading out — stops reliably
function stopTone() {
  if (!currentTone || !audioCtx) return;
  try {
    const { osc, gain } = currentTone;
    currentTone = null;
    gain.gain.cancelScheduledValues(audioCtx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.06);
    setTimeout(() => { try { osc.stop(); } catch(e) {} }, 100);
  } catch(e) { currentTone = null; }
}

// ════════════════════════════════════════════
// IMAGE PREPROCESSING — improves OCR accuracy
// Crop to guide box → scale up 2.5x → pure black & white
// ════════════════════════════════════════════
function preprocessWebcam(srcCanvas) {
  const sw = srcCanvas.width;
  const sh = srcCanvas.height;

  // Crop to the guide rectangle (44% wide, 82% tall, centred)
  const gw = Math.round(sw * 0.44);
  const gh = Math.round(sh * 0.82);
  const gx = Math.round((sw - gw) / 2);
  const gy = Math.round((sh - gh) / 2);

  // Scale up 2.5x — Tesseract reads larger text much more reliably
  const out = document.createElement('canvas');
  out.width  = Math.round(gw * 2.5);
  out.height = Math.round(gh * 2.5);
  const ctx  = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, gx, gy, gw, gh, 0, 0, out.width, out.height);

  applyBW(out, ctx);
  return out;
}

function preprocessUpload(srcCanvas) {
  // Scale down if very large, then apply B&W
  const MAX = 2000;
  let dw = srcCanvas.width, dh = srcCanvas.height;
  if (dw > MAX || dh > MAX) {
    const r = Math.min(MAX / dw, MAX / dh);
    dw = Math.round(dw * r);
    dh = Math.round(dh * r);
  }
  const out = document.createElement('canvas');
  out.width  = dw;
  out.height = dh;
  const ctx  = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, 0, 0, dw, dh);
  applyBW(out, ctx);
  return out;
}

// Image preprocessing: grayscale conversion + binary threshold
// Standard computer vision technique for improving OCR accuracy
// Luminance formula (0.299/0.587/0.114) is the standard ITU-R BT.601 weighting
// https://en.wikipedia.org/wiki/Grayscale#Colorimetric_(perceptual_luminance-preserving)_conversion_to_grayscale
function applyBW(canvas, ctx) {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d   = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];

    // Stronger contrast boost for blurry images — increase 1.8 to 2.2
    g = ((g - 128) * 1.8) + 128;
    g = Math.max(0, Math.min(255, g));
    const v = g > 145 ? 255 : 0;
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

// ════════════════════════════════════════════
// PARSER — fixed: better filtering of discounts/offers
// Parser logic — receipt structure analysis and 
// skip-word list developed through testing real 
// receipts from Coles, Woolworths, Aldi,7-Eleven etc.
// ════════════════════════════════════════════
function parseReceipt(raw) {

  // ── Words that identify non-item lines — skip entire line ──
  const SKIP = [
    'total','subtotal','sub total','gst','eft','eftpos',
    'discount','team discount','mycoles','my coles',
    'flybuys','member','loyalty','points','reward','earn','redeem',
    'offer','saving','special','promotion',
    'tax','change','cash','visa','mastercard','amex',
    'store','manager','phone','register','abn',
    'approved','declined','invoice','receipt',
    'served','transaction','balance','debit','credit',
    'pin','signature','thank','items',
    'date','time','opening','closing',
  ];

  const items = [];

  raw.split('\n').forEach(line => {
    const lo = line.toLowerCase().trim();

    // ── Skip blank lines ──
    if (!lo) return;

    // ── Skip lines containing any skip word ──
    if (SKIP.some(w => lo.includes(w))) return;

    // ── Skip lines with negative values (discounts, credits) ──
    if (line.includes('-$')) return;
    if (line.trim().startsWith('-')) return;

    // ── Skip quantity/weight annotation lines e.g. "2 @ $1.50 EACH" ──
    if (/^\d+\s*@/i.test(lo)) return;
    if (/^=\s*\d/.test(lo)) return;
    if (/^\d+\s*each/i.test(lo)) return;

    // ── Find a price at the end of the line ──
    const pm = line.match(/(\d+\.\d{2})\s*$/);
    if (!pm) return;

    const price = parseFloat(pm[1]);
    if (price <= 0 || price > 500) return;

    // ── Extract the name — everything before the price ──
    let name = line.slice(0, line.lastIndexOf(pm[0])).trim();

    // Remove leading junk characters: * % @ # = numbers at start
    name = name.replace(/^[*%@#=\d\s]+/, '').trim();

    // Remove weight/quantity patterns inside the name
    name = name.replace(/\d+\s*@\s*\$[\d.]+/g, '').trim();
    name = name.replace(/\d+\.\d+\s*kg/gi, '').trim();
    name = name.replace(/\d+\s*each/gi, '').trim();
    name = name.replace(/\d+\s*g\b/gi, '').trim();
    name = name.replace(/\d+\s*ml\b/gi, '').trim();
    name = name.replace(/\d+\s*l\b/gi, '').trim();

    // ── Validation: name must have at least 2 real letters in a row ──
    // This rejects lines that are just symbols, numbers, or OCR noise
    if (!/[a-zA-Z]{2,}/.test(name)) return;

    // ── Validation: name must be at least 30% letters ──
    // Rejects lines like "***  12.3  --" that slipped through
    const letterCount = (name.match(/[a-zA-Z]/g) || []).length;
    if (letterCount / name.length < 0.3) return;

    // ── Final length check ──
    if (name.trim().length < 2) return;

    items.push({ name: name.trim(), price, colour: getColour(name) });
  });

  return items;
}

function extractMeta(raw) {
  const STORES = [
    'coles','woolworths','woolies','aldi','kmart','officeworks',
    'target','chemist','7-eleven','servo','iga','costco',
    'priceline','myer','big w','jb hi-fi','ikea',
  ];

  let store = 'unknown store';
  for (const line of raw.split('\n')) {
    const lo = line.toLowerCase();
    // Only accept lines that contain a store name and nothing like "mycoles"
    if (STORES.some(s => lo.includes(s)) && !lo.includes('mycoles')) {
      store = line.trim().substring(0, 24).toLowerCase();
      break;
    }
  }

  const dm = raw.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  const tm = raw.match(/Time[:\s]+(\d{1,2}:\d{2})/i)
          || raw.match(/\b(\d{1,2}:\d{2})\b/);

  return {
    store,
    date: dm ? dm[1] : '',
    time: tm ? tm[1] : '',
  };
}

// ════════════════════════════════════════════
// COLOUR PICKER — for unrecognised (grey) items
// ════════════════════════════════════════════
// Colour picker / self-updating catalogue system
// Original interaction design — allows the colour
// system to learn from user input over time
function showPickerIfNeeded(items) {
  const unrecognised = items.filter(i => i.colour === DEFAULT_COL);
  const panel = document.getElementById('picker-panel');
  const rows  = document.getElementById('picker-rows');
  rows.innerHTML = '';

  if (unrecognised.length === 0) {
    panel.classList.remove('show');
    return;
  }

  unrecognised.forEach(item => {
    const row = document.createElement('div');
    row.className = 'picker-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'picker-name';
    nameEl.textContent = item.name.toLowerCase();

    const colorInput = document.createElement('input');
    colorInput.type      = 'color';
    colorInput.value     = DEFAULT_COL;
    colorInput.className = 'picker-swatch';

    // Live preview as user drags the colour picker
    colorInput.addEventListener('input', () => {
      item.colour = colorInput.value;
      refreshStripeColour(item);
    });

    const saveBtn = document.createElement('button');
    saveBtn.className   = 'picker-save';
    saveBtn.textContent = 'save to catalogue';
    saveBtn.addEventListener('click', () => {
      const col = colorInput.value;
      // Save the full item name and each significant word
      userColours[item.name.toLowerCase()] = col;
      item.name.toLowerCase().split(/\s+/)
        .filter(w => w.length > 3)
        .forEach(w => { userColours[w] = col; });

      item.colour = col;
      refreshStripeColour(item);
      saveBtn.textContent = 'saved ✓';
      console.log('Catalogue updated:', userColours);
      setTimeout(() => { saveBtn.textContent = 'save to catalogue'; }, 2000);
    });

    row.appendChild(nameEl);
    row.appendChild(colorInput);
    row.appendChild(saveBtn);
    rows.appendChild(row);
  });

  panel.classList.add('show');
}

function refreshStripeColour(item) {
  document.querySelectorAll('#barcode-area .stripe').forEach(el => {
    if (el.dataset.name === item.name) {
      el.style.background = item.colour;
      el.dataset.colour   = item.colour;
    }
  });
}

function closePicker() {
  document.getElementById('picker-panel').classList.remove('show');
}

// ════════════════════════════════════════════
// BARCODE BUILDER
// ════════════════════════════════════════════

// Stripe rendering logic — proportional width by price
// is my core visual concept connecting cost to colour
function buildStripes(containerId, items, ordered) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const total  = items.reduce((s, i) => s + i.price, 0);
  const sorted = ordered
    ? [...items].sort((a, b) => hexToHue(a.colour) - hexToHue(b.colour))
    : [...items].sort((a, b) => b.price - a.price);

  sorted.forEach(item => {
    const pct = (item.price / total) * 100;
    const div = document.createElement('div');
    div.className = 'stripe';
    div.style.cssText = `flex: 0 0 ${pct}%; background: ${item.colour};`;
    div.dataset.colour = item.colour;
    div.dataset.price  = item.price;
    div.dataset.name   = item.name;   // needed for live colour refresh

    const lbl = document.createElement('div');
    lbl.className = 'stripe-label';
    const txt = document.createElement('span');
    txt.className = 'stripe-text';
    txt.textContent = `${item.name.toUpperCase()} · $${item.price.toFixed(2)}`;
    lbl.appendChild(txt);
    div.appendChild(lbl);

    div.addEventListener('mouseenter', () => playTone(item.colour));
    div.addEventListener('mouseleave', stopTone);
    container.appendChild(div);
  });

  // Catch-all — stop sound when cursor leaves entire barcode area
  container.addEventListener('mouseleave', stopTone);
}

// ════════════════════════════════════════════
// SCREEN NAVIGATION
// ════════════════════════════════════════════
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 's-scanner') startCamera();
  if (id === 's-wall')    renderWall();
  stopTone();
  closePicker();
}

// ════════════════════════════════════════════
// CAMERA — unchanged from working version
// ════════════════════════════════════════════
// Camera access via getUserMedia API
// Standard pattern from MDN documentation
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
async function startCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams    = devices.filter(d => d.kind === 'videoinput');

    // Log all cameras so you can see what is detected
    console.log('Cameras found:');
    cams.forEach((c, i) => console.log(`  [${i}] ${c.label || 'unnamed camera'}`));

    // Pick external camera — look for USB in the label first
    // Falls back to last in list (usually external), then first (built-in)
    const external = cams.find(c =>
      c.label.toLowerCase().includes('usb') ||
      c.label.toLowerCase().includes('external') ||
      c.label.toLowerCase().includes('hd') ||
      c.label.toLowerCase().includes('logitech') ||
      c.label.toLowerCase().includes('webcam')
    );

    const cam = external || (cams.length > 1 ? cams[cams.length - 1] : cams[0]);
    console.log('Using:', cam ? cam.label || cam.deviceId : 'default');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: cam
        ? { deviceId: { ideal: cam.deviceId }, width: 1280, height: 720 }
        : { width: 1280, height: 720 }
    });

    document.getElementById('webcam').srcObject = stream;
    startDetection();

  } catch(e) {
    setPill('camera error — ' + e.message, false);
    console.error('Camera error:', e);
  }
}

function startDetection() {
  if (detInterval) clearInterval(detInterval);
  detInterval = setInterval(() => {
    const v = document.getElementById('webcam');
    if (!v.videoWidth) return;
    const tc = document.createElement('canvas');
    tc.width = 80; tc.height = 80;
    const tx = tc.getContext('2d');
    const sw = v.videoWidth  * 0.44;
    const sh = v.videoHeight * 0.8;
    tx.drawImage(v, (v.videoWidth-sw)/2, (v.videoHeight-sh)/2, sw, sh, 0, 0, 80, 80);
    const d = tx.getImageData(0, 0, 80, 80).data;
    let b = 0;
    for (let i = 0; i < d.length; i += 4) b += (d[i]+d[i+1]+d[i+2])/3;
    b /= d.length / 4;
    setPill(b > 155);
  }, 600);
}

function setPill(detected) {
  const el = document.getElementById('detect-pill');
  if (detected === true) {
    el.textContent = 'receipt scanned';
    el.classList.add('green');
  } else if (detected === false) {
    el.textContent = 'no receipt detected.....';
    el.classList.remove('green');
  } else {
    el.textContent = detected;
    el.classList.remove('green');
  }
}

document.getElementById('detect-pill').addEventListener('click', () => {
  if (document.getElementById('detect-pill').classList.contains('green')) {
    captureAndProcess();
  }
});

// ════════════════════════════════════════════
// CAPTURE FROM WEBCAM — now uses preprocessing
// ════════════════════════════════════════════
async function captureAndProcess() {
  const v    = document.getElementById('webcam');
  const snap = document.getElementById('snap');
  const ctx  = snap.getContext('2d');
  snap.width  = v.videoWidth;
  snap.height = v.videoHeight;
  ctx.drawImage(v, 0, 0);

  showProc('scanning receipt...');

  // Preprocess: crop to guide box → scale up → B&W threshold
  const processed = preprocessWebcam(snap);
  await runOCR(processed);
}

// ════════════════════════════════════════════
// UPLOAD — jpg / png
// ════════════════════════════════════════════
document.getElementById('file-input').addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  console.log('Upload:', file.name, file.type, file.size + ' bytes');
  showProc('loading image...');

  const reader = new FileReader();

  reader.onerror = () => {
    hideProc();
    alert('Could not read file. Try a JPEG or PNG.');
  };

  reader.onload = (ev) => {
    const img = new Image();

    img.onerror = () => {
      hideProc();
      alert('Could not display image. Try a different file.');
    };

    img.onload = async () => {
      console.log('Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      showProc('scanning receipt...');
      const processed = preprocessUpload(canvas);  // preprocess before OCR
      await runOCR(processed);
    };

    img.src = ev.target.result;
  };

  reader.readAsDataURL(file);
  this.value = ''; // allow same file again
});

// ════════════════════════════════════════════
// OCR — shared by webcam capture and upload
// ════════════════════════════════════════════
async function runOCR(canvas) {
  try {
    // Tesseract.js OCR — converts image to text string
    // Library docs: https://github.com/naptha/tesseract.js  
    const result = await Tesseract.recognize(canvas, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text')
          showProc('reading... ' + Math.round(m.progress * 100) + '%');
      }
    });

    const raw = result.data.text;
    console.log('═══ RAW OCR OUTPUT ═══');
    console.log(raw);
    console.log('══════════════════════');

    const items = parseReceipt(raw);
    const meta  = extractMeta(raw);
    hideProc();

    if (items.length === 0) {
      setPill(false);
      alert(
        'No items detected.\n\n' +
        'Tips:\n' +
        '• Fill the white box with just the item list\n' +
        '• Use bright overhead lighting\n' +
        '• Hold the receipt very flat and still\n' +
        '• Try uploading a clear photo instead\n\n' +
        'Check browser console (F12) to see what was read.'
      );
      return;
    }

    currentItems   = items;
    currentMeta    = meta;
    previewOrdered = false;

    buildStripes('barcode-area', items, false);

    document.getElementById('preview-meta').textContent =
      [meta.store, meta.date, meta.time].filter(Boolean).join(' · ');
    document.getElementById('order-btn').textContent = 'order';
    document.getElementById('note-input').value = '';

    const vb = document.getElementById('view-barcode-btn');
    vb.style.opacity       = '1';
    vb.style.pointerEvents = 'auto';

    goTo('s-preview');

    // Show colour picker for any grey/unrecognised items
    showPickerIfNeeded(items);

  } catch(e) {
    hideProc();
    console.error('OCR error:', e);
    alert('Error: ' + e.message);
  }
}

function showProc(msg) {
  document.getElementById('proc-msg').textContent = msg;
  document.getElementById('processing').classList.add('show');
}
function hideProc() {
  document.getElementById('processing').classList.remove('show');
}

// ════════════════════════════════════════════
// PREVIEW CONTROLS
// ════════════════════════════════════════════
document.getElementById('order-btn').addEventListener('click', () => {
  previewOrdered = !previewOrdered;
  buildStripes('barcode-area', currentItems, previewOrdered);
  document.getElementById('order-btn').textContent = previewOrdered ? 'unorder' : 'order';
  showPickerIfNeeded(currentItems);
});

document.getElementById('addwall-btn').addEventListener('click', () => {
  allReceipts.push({
    ...currentMeta,
    items: [...currentItems],
    note:  document.getElementById('note-input').value,
    id:    Date.now(),
  });
  document.getElementById('note-input').value = '';
  goTo('s-wall');
});

document.getElementById('view-barcode-btn').addEventListener('click', () => {
  if (currentItems.length) goTo('s-preview');
});

// ════════════════════════════════════════════
// WALL
// ════════════════════════════════════════════
function renderWall() {
  const grid  = document.getElementById('receipts-grid');
  const empty = document.getElementById('empty-msg');

  Array.from(grid.children).forEach(c => { if (c !== empty) c.remove(); });

  if (allReceipts.length === 0) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  allReceipts.forEach((receipt, idx) => {
    const card = document.createElement('div');
    card.className = 'receipt-card';

    const bar    = document.createElement('div');
    bar.className = 'card-barcode';
    const total  = receipt.items.reduce((s, i) => s + i.price, 0);
    const sorted = wallOrdered
      ? [...receipt.items].sort((a, b) => hexToHue(a.colour) - hexToHue(b.colour))
      : [...receipt.items].sort((a, b) => b.price - a.price);

    sorted.forEach(item => {
      const s = document.createElement('div');
      s.className = 'card-stripe';
      s.style.cssText = `flex: 0 0 ${(item.price/total)*100}%; background:${item.colour};`;
      bar.appendChild(s);
    });

    const ov = document.createElement('div');
    ov.className = 'card-overlay';
    ov.innerHTML = '<span>view</span>';

    const lbl = document.createElement('div');
    lbl.className = 'card-label';
    lbl.textContent = [receipt.store, receipt.date].filter(Boolean).join(' · ');

    card.appendChild(bar);
    card.appendChild(ov);
    card.appendChild(lbl);
    card.addEventListener('click', () => showFullscreen(idx));
    grid.appendChild(card);
  });
}

document.getElementById('wall-order-btn').addEventListener('click', () => {
  wallOrdered = !wallOrdered;
  document.getElementById('wall-order-btn').textContent = wallOrdered ? 'unorder' : 'order';
  renderWall();
});

// ════════════════════════════════════════════
// FULLSCREEN
// ════════════════════════════════════════════
function showFullscreen(idx) {
  const r = allReceipts[idx];
  buildStripes('fs-barcode', r.items, false);

  document.querySelectorAll('#fs-barcode .stripe').forEach(s => {
    s.addEventListener('mouseenter', () => playTone(s.dataset.colour));
    s.addEventListener('mouseleave', stopTone);
  });
  document.getElementById('fs-barcode').addEventListener('mouseleave', stopTone);

  document.getElementById('fs-meta').textContent =
    [r.store, r.date, r.time].filter(Boolean).join(' · ') +
    (r.note ? '  —  ' + r.note : '');

  goTo('s-fullscreen');
}

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
document.addEventListener('click', ensureAudio, { once: true });
