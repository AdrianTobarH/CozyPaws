// CozyPaws — script.js
const $ = (sel) => document.querySelector(sel);
const byId = (id) => document.getElementById(id);

const ageStage = byId('ageStage');
const puppyMonthsWrap = byId('puppyMonthsWrap');
const puppyMonths = byId('puppyMonths');
const energy = byId('energy');
const weightClass = byId('weightClass');
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

// Helpers
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round5 = (n) => Math.round(n / 5) * 5;

// Ranges base (min,max) in minutes per day before modifiers
function baseRangeMinutes({ageStage, energy, puppyMonths}){
  if(ageStage === 'puppy'){
    const months = clamp(Number(puppyMonths||6), 1, 18);
    const total = clamp(months * 10, 20, 60); // 5 min/mes 2 veces → ~10m*mes, total 20–60
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
    case 'yard': return 0.9; // algo de autoejercicio
    case 'working': return 1.3;
    case 'street': return 1.0; // varía; mantenemos y añadimos nota
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
    // 3–5 salidas cortas
    const per = clamp(round5(totalMin / 4), 8, 20);
    const walks = Math.max(3, Math.round(totalMin / per));
    return {walks, per};
  }
  // adultos/senior
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

function assembleNotes(inputs, totalRange, total){
  const notes = [];
  const add = (msg, tone='ok') => notes.push({msg, tone});
  // Lifestyle
  if(inputs.lifestyle === 'yard'){
    add("Tiene patio/rural: aún así, salir a oler fuera del hogar sigue siendo clave.", 'warn');
  }
  if(inputs.lifestyle === 'street'){
    add("Callejero/comunitario: suele recorrer grandes distancias por su cuenta; al adoptarlo, introduce rutinas de paseo graduales.", 'warn');
  }
  if(inputs.lifestyle === 'working'){
    add("Trabajo/deporte: prioriza días de descanso activo y nutrición acorde al gasto.", 'warn');
  }
  // Health
  if(inputs.brachy){
    add("Braquicéfalo: limita cada paseo a ≤20 min; evita calor y esfuerzo.", 'danger');
  }
  if(inputs.joints){
    add("Articulaciones sensibles: elige superficies blandas, varios paseos cortos y considera hidroterapia.", 'warn');
  }
  if(inputs.obese){
    add("Sobrepeso: progresa +5–10 min/semana; combina con dieta supervisada por veterinario.", 'warn');
  }
  if(inputs.cardioResp){
    add("Cardiaco/respiratorio: mantén intensidad baja y consulta a tu veterinario para límites precisos.", 'danger');
  }
  // Climate
  if(inputs.climate === 'hot'){
    add("Clima caluroso: pasea al amanecer/atardecer y lleva agua; revisa la temperatura del suelo.", 'warn');
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
  // General
  add(`Rango sugerido tras ajustes: ${totalRange[0]}–${totalRange[1]} min/día.`, 'ok');
  add("Ajusta siempre según señales del perro (jadeo, fatiga, desinterés).", 'ok');
  return notes;
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
  // Apply multipliers
  const mult = sizeMultiplier(inputs.weightClass)
              * lifestyleMultiplier(inputs.lifestyle)
              * climateMultiplier(inputs.climate)
              * healthMultiplier(inputs);
  let minAdj = round5(minB * mult);
  let maxAdj = round5(maxB * mult);

  // Bounds
  minAdj = clamp(minAdj, 20, 180);
  maxAdj = clamp(Math.max(maxAdj, minAdj + 5), 30, 240);

  // Choose a central recommendation near the middle of the adjusted range
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

  // Notes tags
  notesEl.innerHTML = "";
  const notes = assembleNotes(inputs, [minAdj, maxAdj], total);
  notes.forEach(n => {
    const span = document.createElement('span');
    span.className = `tag ${n.tone}`;
    span.textContent = n.msg;
    notesEl.appendChild(span);
  });

  // Save latest result for download/copy
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
}

let latestResult = null;

byId('calc-form').addEventListener('submit', (e) => {
  e.preventDefault();
  calculate();
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
