// CozyPaws — script.js
const $ = (sel) => document.querySelector(sel);
const byId = (id) => document.getElementById(id);

const ageStage = byId('ageStage');
const puppyMonthsWrap = byId('puppyMonthsWrap');
const puppyMonths = byId('puppyMonths');
const energy = byId('energy');
const weightClass = byId('weightClass');
const breedPreset = byId('breedPreset');
const ecCity = byId('ecCity');
const lifestyle = byId('lifestyle');
const brachy = byId('brachy');
const joints = byId('joints');
const obese = byId('obese');
const cardioResp = byId('cardioResp');
const climate = byId('climate');

const dailyMinEl = byId('dailyMin');
const walksPerDayEl = byId('walksPerDay');
const perWalkEl = byId('perWalk');
const enrichmentEl = byId('enrichment');
const rangeHintEl = byId('rangeHint');
const summaryEl = byId('summary');
const numbersEl = byId('numbers');
const notesEl = byId('notes');
const shareBlock = byId('shareBlock');

byId('year').textContent = new Date().getFullYear();
// Hide months on initial load based on age
puppyMonthsWrap.hidden = ageStage.value !== 'puppy';


// Theme toggle
const themeToggle = byId('themeToggle');
(function initTheme(){
  const saved = localStorage.getItem('cozypaws_theme') || 'dark';
  if(saved==='light'){ document.body.classList.add('light'); }
})();
themeToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('light');
  localStorage.setItem('cozypaws_theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

ageStage.addEventListener('change', () => {
  puppyMonthsWrap.hidden = ageStage.value !== 'puppy';
});

byId('resetBtn').addEventListener('click', () => {
  byId('calc-form').reset();
  puppyMonthsWrap.hidden = true;
  summaryEl.textContent = "Completa el formulario y presiona Calcular.";
  numbersEl.classList.add('hidden');
  notesEl.classList.add('hidden');
  shareBlock.classList.add('hidden');
});

// Breed presets
breedPreset.addEventListener('change', ()=>{
  const v = breedPreset.value;
  // Reset health toggles
  brachy.checked = false; joints.checked = false; obese.checked = false; cardioResp.checked = false;
  energy.value = 'moderate';
  switch(v){
    case 'husky':
    case 'border_collie':
    case 'malinois':
    case 'gspointer':
    case 'aussie':
    case 'german_shepherd':
    case 'samoyed':
    case 'akita':
    case 'jack_russell':
    case 'boxer':
      energy.value = 'high'; break;
    case 'labrador':
    case 'golden':
    case 'beagle':
    case 'cocker':
    case 'schnauzer_std':
    case 'poodle_std':
    case 'pitbull':
    case 'american_bully':
    case 'bernese':
      energy.value = 'moderate'; break;
    case 'bulldog':
    case 'frenchie':
    case 'pug':
    case 'boston':
    case 'shih_tzu':
      energy.value = 'low'; brachy.checked = true; break;
    case 'chow':
      energy.value = 'low'; break;
    case 'chihuahua':
    case 'dachshund':
    case 'schnauzer_mini':
    case 'poodle_toy':
    case 'pomeranian':
      energy.value = 'low'; break;
    case 'pomsky':
      energy.value = 'moderate'; /* mezcla: tamaño pequeño-mediano, energía media/alta */ break;
    case 'yorkie':
      energy.value = 'moderate'; break;
    default: break;
  }
});

// City -> climate
ecCity.addEventListener('change', ()=>{
  const map = {
    quito:'altitude',
    cuenca:'altitude',
    ambato:'altitude',
    riobamba:'altitude',
    guayaquil:'hot',
    manta:'hot',
    esmeraldas:'hot',
    tena:'hot',
    loja:'temperate',
    galapagos:'temperate'
  };
  const v = ecCity.value;
  if(map[v]) climate.value = map[v];
});

// Helpers
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round5 = (n) => Math.round(n / 5) * 5;

// Ranges base (min,max) in minutes per day before modifiers
function baseRangeMinutes({ageStage, energy, puppyMonths}){
  if(ageStage === 'puppy'){
    const months = clamp(Number(puppyMonths||6), 1, 18);
    const total = clamp(months * 10, 20, 60); // 5 min/mes 2 veces → ~10m*mes
    const range = 10;
    return [clamp(total - range, 15, 60), clamp(total + range, 25, 80)];
  }
  if(ageStage === 'senior'){
    return [30, 60];
  }
  // adult
  switch(energy){
    case 'high': return [90, 120];
    case 'low': return [30, 60];
    default: return [45, 75]; // moderate
  }
}

function sizeMultiplier(weightClass){
  switch(weightClass){
    case 'toy': return 0.9;
    case 'small': return 0.95;
    case 'medium': return 1.0;
    case 'large': return 1.1;
    case 'giant': return 1.2;
    default: return 1.0;
  }
}

function lifestyleMultiplier(val){
  switch(val){
    case 'yard': return 0.9;
    case 'working': return 1.3;
    case 'street': return 1.0;
    default: return 1.0;
  }
}

function climateMultiplier(val){
  switch(val){
    case 'hot': return 0.8;
    case 'altitude': return 0.9;
    case 'cold': return 0.9;
    default: return 1.0;
  }
}

function healthMultiplier({brachy,joints,obese,cardioResp}){
  let mult = 1.0;
  if(brachy) mult *= 0.75;
  if(joints) mult *= 0.8;
  if(obese) mult *= 0.85;
  if(cardioResp) mult *= 0.7;
  return mult;
}

function calcWalksPerDay(totalMin, {ageStage, brachy, joints}){
  if(ageStage === 'puppy'){
    const per = clamp(round5(totalMin / 4), 8, 20);
    const walks = Math.max(3, Math.round(totalMin / per));
    return {walks, per};
  }
  let walks = totalMin > 80 ? 3 : 2;
  let per = round5(totalMin / walks);
  if(joints) { walks = Math.max(3, walks); per = clamp(round5(totalMin / walks), 10, 20); }
  if(brachy) { per = Math.min(per, 20); }
  return {walks, per: per};
}

function enrichmentMinutes({ageStage, energy}){
  if(ageStage === 'puppy') return 15;
  if(ageStage === 'senior') return 10;
  switch(energy){
    case 'high': return 20;
    case 'low': return 10;
    default: return 15;
  }
}

function assembleNotes(inputs, totalRange){
  const notes = [];
  const add = (msg, tone='ok') => notes.push({msg, tone});
  if(inputs.lifestyle === 'yard'){
    add("Tiene patio/rural: aún así, salir a oler fuera del hogar sigue siendo clave.", 'warn');
  }
  if(inputs.lifestyle === 'street'){
    add("Callejero/comunitario: suele recorrer distancias por su cuenta; al adoptarlo, introduce rutinas graduales.", 'warn');
  }
  if(inputs.lifestyle === 'working'){
    add("Trabajo/deporte: prioriza descanso activo y nutrición acorde al gasto.", 'warn');
  }
  if(inputs.brachy){
    add("Braquicéfalo: limita cada paseo a ≤20 min; evita calor y esfuerzo.", 'danger');
  }
  if(inputs.joints){
    add("Articulaciones sensibles: superficie blanda, varios paseos cortos, considera hidroterapia.", 'warn');
  }
  if(inputs.obese){
    add("Sobrepeso: progresa +5–10 min/semana; acompaña con plan nutricional.", 'warn');
  }
  if(inputs.cardioResp){
    add("Cardiaco/respiratorio: intensidad baja y guía veterinaria.", 'danger');
  }
  if(inputs.climate === 'hot'){
    add("Clima caluroso: pasea al amanecer/atardecer, hidrata y cuida almohadillas.", 'warn');
  }
  if(inputs.climate === 'altitude'){
    add("Altitud alta: si no está aclimatado, reduce ritmo y observa respiración.", 'warn');
  }
  if(inputs.ageStage === 'senior'){
    add("Senior: prioriza calidad sobre cantidad, con pausas para olfatear.", 'ok');
  }
  if(inputs.ageStage === 'puppy'){
    add("Cachorro: varias salidas cortas y mucho descanso; socialización positiva.", 'ok');
  }
  add(`Rango sugerido tras ajustes: ${totalRange[0]}–${totalRange[1]} min/día.`, 'ok');
  add("Ajusta según señales del perro (jadeo, fatiga, desinterés).", 'ok');
  return notes;
}

// Upward bucket always
function minutesToBucket(min){
  const buckets = [30, 60, 120, 180, 240];
  for(const b of buckets){
    if(min <= b) return b;
  }
  return buckets[buckets.length-1];
}
function bucketLabel(min){
  switch(min){
    case 30: return "30 minutos";
    case 60: return "1 hora";
    case 120: return "2 horas";
    case 180: return "3 horas";
    case 240: return "4 horas";
    default: return `${min} min`;
  }
}

const step1pill = byId('step1pill');
const step2pill = byId('step2pill');
const screen1 = document.querySelector('[data-screen="1"]');
const screen2 = document.querySelector('[data-screen="2"]');
const backBtn = byId('backBtn');

function goScreen(n){
  if(n===1){
    screen1.classList.add('screen-active');
    screen2.classList.remove('screen-active');
    step1pill.classList.add('active');
    step2pill.classList.remove('active');
    window.scrollTo({top:0, behavior:'smooth'});
  }else{
    screen2.classList.add('screen-active');
    screen1.classList.remove('screen-active');
    step2pill.classList.add('active');
    step1pill.classList.remove('active');
    window.scrollTo({top:0, behavior:'smooth'});
  }
}
backBtn.addEventListener('click', ()=> goScreen(1));

const ctaBlock = byId('ctaBlock');
const waBtn = byId('waBtn');
const serviceHoursEl = byId('serviceHours');
const WHATSAPP = "https://wa.me/593987874886";

function updateCTA(result){
  const bucket = minutesToBucket(result.recommendation.minutes_per_day);
  const label = bucketLabel(bucket);
  serviceHoursEl.textContent = label;
  const name = result.dogName ? ` para ${result.dogName}` : "";
  const text = encodeURIComponent(`Hola CozyPaws, quiero agendar ${label}${name} de caminata/actividad.`);
  waBtn.href = `${WHATSAPP}?text=${text}`;
  ctaBlock.classList.remove('hidden');
}

function calculate(){
  const inputs = {
    ageStage: ageStage.value,
    puppyMonths: Number(puppyMonths.value || 6),
    energy: energy.value,
    weightClass: weightClass.value,
    lifestyle: lifestyle.value,
    brachy: brachy.checked,
    joints: joints.checked,
    obese: obese.checked,
    cardioResp: cardioResp.checked,
    climate: climate.value,
    dogName: byId('dogName').value.trim()
  };

  let [minB, maxB] = baseRangeMinutes(inputs);
  const mult = sizeMultiplier(inputs.weightClass)
              * lifestyleMultiplier(inputs.lifestyle)
              * climateMultiplier(inputs.climate)
              * healthMultiplier(inputs);
  let minAdj = round5(minB * mult);
  let maxAdj = round5(maxB * mult);
  minAdj = clamp(minAdj, 20, 180);
  maxAdj = clamp(Math.max(maxAdj, minAdj + 5), 30, 240);
  const total = round5((minAdj + maxAdj) / 2);

  const {walks, per} = calcWalksPerDay(total, inputs);
  const enrich = enrichmentMinutes(inputs);

  // Render
  numbersEl.classList.remove('hidden');
  notesEl.classList.remove('hidden');
  shareBlock.classList.remove('hidden');
  summaryEl.innerHTML = inputs.dogName
    ? `<strong>${inputs.dogName}</strong>: recomendación personalizada basada en edad, energía, peso, salud y clima.`
    : `Recomendación personalizada basada en edad, energía, peso, salud y clima.`;

  dailyMinEl.textContent = total;
  walksPerDayEl.textContent = walks;
  perWalkEl.textContent = per;
  enrichmentEl.textContent = enrich;
  rangeHintEl.textContent = `Rango aproximado: ${minAdj}–${maxAdj} min/día`;

  notesEl.innerHTML = "";
  const notes = assembleNotes(inputs, [minAdj, maxAdj]);
  notes.forEach(n => {
    const span = document.createElement('span');
    span.className = `tag ${n.tone}`;
    span.textContent = n.msg;
    notesEl.appendChild(span);
  });

  latestResult = {
    ...inputs,
    recommendation: {
      minutes_per_day: total,
      recommended_range: [minAdj, maxAdj],
      walks_per_day: walks,
      minutes_per_walk: per,
      enrichment_minutes: enrich
    },
    timestamp: new Date().toISOString()
  };
  updateCTA(latestResult);
}

let latestResult = null;

document.getElementById('calc-form').addEventListener('submit', (e) => {
  e.preventDefault();
  calculate();
  goScreen(2);
});

byId('copyBtn').addEventListener('click', async () => {
  if(!latestResult) return;
  const r = latestResult.recommendation;
  const name = latestResult.dogName ? ` para ${latestResult.dogName}` : "";
  const text = [
    `CozyPaws — Resumen${name}`,
    `Minutos diarios: ${r.minutes_per_day} (rango ${r.recommended_range[0]}–${r.recommended_range[1]})`,
    `Paseos/día: ${r.walks_per_day} • ${r.minutes_per_walk} min cada uno`,
    `Enriquecimiento mental: ${r.enrichment_minutes} min/día`
  ].join('\n');
  try{
    await navigator.clipboard.writeText(text);
    alert("Resumen copiado al portapapeles ✅");
  }catch{
    alert("No se pudo copiar automáticamente. Selecciona y copia manualmente.");
  }
});

byId('downloadBtn').addEventListener('click', () => {
  if(!latestResult) return;
  const data = new Blob([JSON.stringify(latestResult, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cozypaws_recomendacion_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
});
