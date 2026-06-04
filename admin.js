// ── PIN ───────────────────────────────────────────────────────────────────────
let pin = '';
function pk(k) {
  if (pin.length >= 6) return;
  pin += k; dots();
  if (pin.length === 4) { const s = getStaffByPin(pin); if (s) { doLogin(s); return; } }
  if (pin.length === 6) tryLogin();
}
function pdel() { pin = pin.slice(0,-1); dots(); }
function dots(err) {
  for (let i=0;i<4;i++) {
    const d = document.getElementById('d'+i);
    d.className = 'pin-dot'+(i<pin.length?' filled':'')+(err?' error':'');
  }
}
function tryLogin() {
  const s = getStaffByPin(pin);
  if (s) { doLogin(s); }
  else {
    dots(true);
    document.getElementById('loginErr').textContent = 'Неверный PIN';
    pin = '';
    setTimeout(()=>{ dots(); document.getElementById('loginErr').textContent=''; }, 1200);
  }
}

// ── SESSION ───────────────────────────────────────────────────────────────────
let ME = null;
let TAB = 'queue';
let PROG_LEVEL = 'bachelor';

function doLogin(staff) {
  ME = staff; TAB = 'queue'; PROG_LEVEL = 'bachelor';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminScreen').style.display = 'block';
  document.getElementById('aName').textContent = staff.name;
  document.getElementById('aCab').textContent  = 'Кабинет ' + staff.cabinet + ' · ' + staff.floor;
  renderAll();
  startRefresh();
}
function logout() {
  ME = null; pin = ''; dots(); stopRefresh();
  document.getElementById('adminScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

// ── STORAGE ───────────────────────────────────────────────────────────────────
// ── STORAGE ───────────────────────────────────────────────────────────────────
let CACHE_QUEUE = {};
let CACHE_ACTIVE = {};

function getActive() {
  return CACHE_ACTIVE || {};
}

function setActive(obj) {
  CACHE_ACTIVE = obj;
  window.db.ref('active').set(obj);
}

function saveQueueData(d) {
  CACHE_QUEUE[ME.id] = d;
  window.db.ref('queues/' + ME.id).set(d);
}

function listenFirebase() {
  window.db.ref('active').on('value', function(snap) {
    CACHE_ACTIVE = snap.val() || {};
    if (ME) renderAll();
  });

  window.db.ref('queues').on('value', function(snap) {
    CACHE_QUEUE = snap.val() || {};
    if (ME) renderAll();
  });
}


// ── LEVEL DEFINITIONS ─────────────────────────────────────────────────────────
const LEVELS_DEF = [
  { id:'bachelor', label:'Бакалавриат',    prefix:'6', color:'#3056D3' },
  { id:'master',   label:'Магистратура',   prefix:'7', color:'#7c3aed' },
  { id:'doctor',   label:'Докторантура',   prefix:'8', color:'#059669' },
  { id:'college',  label:'Высший колледж', prefix:'K', color:'#d97706' },
];

function getMyPrograms() {
  if (typeof PROGRAMS === 'undefined') return [];

  return Object.values(PROGRAMS).flat();
}

// ── RENDER ALL ────────────────────────────────────────────────────────────────
function renderAll() { renderTabs(); TAB === 'queue' ? renderQueue() : renderProgs(); }

function renderTabs() {
  const data    = getQueueData();
  const waiting = data.queue.filter(q => !q.called).length;
  const active  = getMyActive().length;
  document.getElementById('aTabs').innerHTML =
    '<button class="a-tab '+(TAB==='queue'?'on':'')+'" onclick="switchTab(\'queue\')">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' +
      'Очередь' +
      (waiting > 0 ? '<span class="a-tbadge o">'+waiting+'</span>' : '') +
    '</button>' +
    '<button class="a-tab '+(TAB==='progs'?'on':'')+'" onclick="switchTab(\'progs\')">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' +
      'Мои ОП' +
      (active > 0 ? '<span class="a-tbadge g">'+active+'</span>' : '<span class="a-tbadge">0</span>') +
    '</button>';
}
function switchTab(t) { TAB = t; renderAll(); }

// ── QUEUE TAB ─────────────────────────────────────────────────────────────────
function renderQueue() {
  const data    = getQueueData();
  const waiting = data.queue.filter(q => !q.called);
  const served  = data.history.length;
  const pfx     = ME.id.replace('staff_', 'S');

  const curHTML = data.current
    ? '<div class="cur-num" id="curNum"><span class="cur-pfx">'+pfx+'-</span>'+String(data.current).padStart(3,'0')+'</div>'
    : '<div class="cur-empty">Ожидание...</div>';

  const nxt = waiting[0];
  const nextCard = nxt
    ? '<div class="next-card">' +
        '<div class="nc-row"><div class="nc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>' +
          '<div><div class="nc-v">'+pfx+'-'+String(nxt.number).padStart(3,'0')+'</div><div class="nc-l">Следующий</div></div></div>' +
        '<div class="nc-row"><div class="nc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>' +
          '<div><div class="nc-v">'+nxt.time+'</div><div class="nc-l">Время</div></div></div>' +
      '</div>'
    : '';

  const qItems = waiting.length
    ? waiting.slice(0,15).map(function(q,i) {
        return '<div class="q-row '+(i===0?'nx':'')+'">' +
          '<div class="q-n '+(i===0?'nx':'')+'">'+String(q.number).padStart(3,'0')+'</div>' +
          '<div class="q-b"><div class="q-c">'+q.code+'</div><div class="q-nm">'+q.name+'</div></div>' +
          '<div class="q-t">'+q.time+'</div>' +
          (i===0 ? '<span class="nx-tag">Следующий</span>' : '') +
        '</div>';
      }).join('')
    : '<div class="empty-q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Очередь пуста</p></div>';

  const hist = data.history.length
    ? data.history.slice().reverse().slice(0,8).map(function(h) {
        return '<div class="q-row">' +
          '<div class="q-n" style="background:#e8ecf8;color:var(--text-3)">'+String(h.number).padStart(3,'0')+'</div>' +
          '<div class="q-b"><div class="q-c">'+h.code+'</div><div class="q-nm">'+h.name+'</div></div>' +
          '<div class="q-t">'+h.calledAt+'</div>' +
        '</div>';
      }).join('')
    : '<p style="color:var(--text-3);font-size:12px;padding:6px 0">Нет записей</p>';

  const myAct = getMyActive();
  const warnHTML = myAct.length === 0
    ? '<div class="warn-box"><span>⚠️</span><div><b>Нет активных ОП</b><br>Перейдите в «Мои ОП» и включите нужные программы</div></div>'
    : '';

  document.getElementById('aContent').innerHTML =
    warnHTML +
    '<div class="stats">' +
      '<div class="sc"><div class="sv">'+(data.current||'—')+'</div><div class="sl">Вызван</div></div>' +
      '<div class="sc o"><div class="sv">'+waiting.length+'</div><div class="sl">Ожидают</div></div>' +
      '<div class="sc g"><div class="sv">'+served+'</div><div class="sl">Обслужено</div></div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="p-top">' +
        '<div class="p-top-l"><div class="p-sub">Кабинет '+ME.cabinet+' · '+ME.floor+'</div><div class="p-title">'+ME.name+'</div></div>' +
        '<div class="p-badge">'+waiting.length+' ожидают</div>' +
      '</div>' +
      '<div class="cur-block"><div><div class="cur-lbl">Текущий вызов</div>'+curHTML+'</div>'+nextCard+'</div>' +
      '<div class="acts">' +
        '<button class="btn-next" onclick="callNext()" '+(waiting.length===0?'disabled':'')+'>'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>'+
          'Следующий'+(waiting.length>0?' · '+waiting.length+' чел.':'')+
        '</button>' +
        '<button class="btn-rst" onclick="resetQ()">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>Сброс'+
        '</button>' +
      '</div>' +
      '<hr class="dash"><div class="ls"><div class="ls-h"><span class="ls-t">В очереди</span><span class="ls-b">'+waiting.length+'</span></div><div class="q-list">'+qItems+'</div></div>' +
      '<hr class="dash"><div class="ls"><div class="ls-h"><span class="ls-t">История</span><span class="ls-b g">'+served+'</span></div><div class="q-list">'+hist+'</div></div>' +
    '</div>';
}

// ── PROGRAMS TAB ──────────────────────────────────────────────────────────────
function renderProgs() {
  const myAct   = new Set(getMyActive());
  const myProgs = getMyPrograms();
  const total   = myProgs.length;
  const active  = myProgs.filter(p => myAct.has(p.code)).length;
  const lvDef   = LEVELS_DEF.find(l => l.id === PROG_LEVEL);

  // Level sub-tabs
  const levelTabsHTML = LEVELS_DEF.map(function(lv) {
    const lProgs  = myProgs.filter(p => p.code.startsWith(lv.prefix));
    const lActive = lProgs.filter(p => myAct.has(p.code)).length;
    const isEmpty = lProgs.length === 0;
    return '<button class="lv-tab '+(PROG_LEVEL===lv.id?'on':'')+' '+(isEmpty?'empty':'')+'" onclick="switchProgLevel(\''+lv.id+'\')">' +
      lv.label +
      (lProgs.length > 0 ? '<span class="lv-cnt '+(lActive>0?'on':'')+'">'+lActive+'/'+lProgs.length+'</span>' : '') +
    '</button>';
  }).join('');

  // Programs for current level
  const curProgs  = myProgs.filter(p => p.code.startsWith(lvDef.prefix));
  const curActive = curProgs.filter(p => myAct.has(p.code)).length;

  const progsHTML = curProgs.length
    ? curProgs.map(function(p) {
        return '<div class="prog-item">' +
          '<span class="prog-code">'+p.code+'</span>' +
          '<span class="prog-name">'+(p.ip ? '<span class="prog-ip">IP</span>' : '')+' '+p.name+'</span>' +
          '<label class="toggle">' +
            '<input type="checkbox" '+(myAct.has(p.code)?'checked':'')+' onchange="toggleProg(\''+p.code+'\',this.checked)">' +
            '<span class="toggle-sl"></span>' +
          '</label>' +
        '</div>';
      }).join('')
    : '<div class="no-progs">📋 Нет программ этого уровня</div>';

  document.getElementById('aContent').innerHTML =
    '<div class="progs-header">' +
      '<div><h3>Мои ОП на сегодня</h3><p>Включите программы — студенты увидят только их</p></div>' +
      '<div class="progs-counts">' +
        '<div class="pc g"><div class="pc-v">'+active+'</div><div class="pc-l">Активно</div></div>' +
        '<div class="pc"><div class="pc-v">'+total+'</div><div class="pc-l">Всего</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="lv-tabs">'+levelTabsHTML+'</div>' +
    '<div class="level-panel">' +
      '<div class="lp-head">' +
        '<div><div class="lp-title">'+lvDef.label+'</div><div class="lp-sub">'+curActive+' из '+curProgs.length+' активно</div></div>' +
        (curProgs.length > 0
          ? '<div class="lp-btns"><button class="btn-lv on" onclick="levelAllOn(\''+lvDef.prefix+'\')">✓ Все</button><button class="btn-lv off" onclick="levelAllOff(\''+lvDef.prefix+'\')">✕ Все</button></div>'
          : '') +
      '</div>' +
      '<div class="prog-items">'+progsHTML+'</div>' +
    '</div>' +
    '<div class="global-acts">' +
      '<button class="btn-all-on" onclick="allOn()">✓ Включить все мои ОП</button>' +
      '<button class="btn-all-off" onclick="allOff()">✕ Выключить все</button>' +
    '</div>';
}

function switchProgLevel(id) { PROG_LEVEL = id; renderProgs(); }

// ── TOGGLE ACTIONS ────────────────────────────────────────────────────────────
function toggleProg(code, on) {
  let arr = getMyActive();
  if (on) { if (!arr.includes(code)) arr.push(code); }
  else    { arr = arr.filter(c => c !== code); }
  setMyActive(arr);
  renderTabs();
}
function levelAllOn(prefix) {
  const codes = getMyPrograms().filter(p => p.code.startsWith(prefix)).map(p => p.code);
  setMyActive([...new Set([...getMyActive(), ...codes])]);
  renderAll();
  toast(LEVELS_DEF.find(l=>l.prefix===prefix).label + ': все включены');
}
function levelAllOff(prefix) {
  setMyActive(getMyActive().filter(c => !c.startsWith(prefix)));
  renderAll();
  toast(LEVELS_DEF.find(l=>l.prefix===prefix).label + ': все выключены');
}
function allOn()  { setMyActive([...ME.programs]); renderAll(); toast('Все ' + ME.programs.length + ' ОП включены'); }
function allOff() { setMyActive([]); renderAll(); toast('Все ОП выключены'); }

// ── QUEUE ACTIONS ─────────────────────────────────────────────────────────────
function callNext() {
  const data = getQueueData();
  const w = data.queue.filter(q => !q.called);
  if (!w.length) return;
  const nxt = w[0];
  nxt.called   = true;
  data.current = nxt.number;
  data.history.push({ number:nxt.number, code:nxt.code, name:nxt.name, calledAt:nowT() });
  saveQueueData(data);
  renderAll();
  toast('▶ ' + ME.id.replace('staff_','S') + '-' + String(nxt.number).padStart(3,'0') + ' — ' + nxt.name.substring(0,28));
}
function resetQ() {
  if (!confirm('Сбросить очередь?')) return;
  saveQueueData({ current:0, queue:[], history:[] });
  renderAll();
  toast('Очередь сброшена');
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function nowT() { return new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}); }
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
let timer = null;
function startRefresh() { timer = setInterval(function(){ if(ME) renderAll(); }, 3500); }
function stopRefresh()  { if(timer) clearInterval(timer); }

listenFirebase();

