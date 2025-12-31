const $ = id => document.getElementById(id);
const play = id => { const a = $(id); if(a) { a.currentTime = 0; a.play().catch(()=>{}); }};
const pad = n => String(n).padStart(2, '0');
const fmtTime = s => `${pad(Math.floor(s/60))}:${pad(s%60)}`;
const fmtTime3 = s => `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}`;

let focused = null, currentSection = 'timer';

// 背景画像の切り替え
const bgImgs = Array.from({length: 16}, (_, i) => `background-image/bgimg-${i+1}.jpg`);
const bg = document.querySelectorAll('.bg-img');
let bgIdx = 0, bgVis = 0;
setInterval(() => {
  const next = (bgVis + 1) % 2;
  bgIdx = (bgIdx + 1) % bgImgs.length;
  bg[next].src = bgImgs[bgIdx];
  bg[bgVis].classList.remove('active');
  bg[next].classList.add('active');
  bgVis = next;
}, 10000);

// サイドバートグル
function toggleSidebar() {
  const sidebar = $('sidebar');
  const overlay = $('mobile-overlay');
  if (window.innerWidth <= 1024) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  } else {
    sidebar.classList.toggle('collapsed');
  }
  play('snd-click');
}

// セクション切り替え
function switchSection(section) {
  play('snd-click');
  currentSection = section;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  $(`section-${section}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  event.target.closest('.nav-item')?.classList.add('active');
  if (window.innerWidth <= 1024) {
    $('sidebar').classList.remove('open');
    $('mobile-overlay').classList.remove('show');
  }
  updateFloatDisplay();
}

// 新しいタブを開く
function openNewTab() {
  window.open('about:blank', '_blank');
  play('snd-click');
}

// キーボードショートカット
document.addEventListener('keydown', e => {
  if (e.target.tagName !== 'INPUT' && e.target.contentEditable !== 'true') {
    const key = e.key;
    const sections = ['timer', 'clock', 'weather', 'stopwatch', 'custom-timer', 'memo', 'gemini', 'calculator'];
    const idx = parseInt(key) - 1;
    if (idx >= 0 && idx < sections.length) {
      switchSection(sections[idx]);
    } else if (key === ' ' && currentSection === 'timer') {
      e.preventDefault();
      toggleTimer();
    }
  }
  
  if (focused) {
    if (e.ctrlKey && !e.shiftKey && e.key === 'b') { e.preventDefault(); fmt('bold'); }
    else if (e.ctrlKey && !e.shiftKey && e.key === 'u') { e.preventDefault(); fmt('underline'); }
    else if (e.ctrlKey && e.shiftKey && e.key === '>') { e.preventDefault(); fmt('larger'); }
    else if (e.ctrlKey && e.shiftKey && e.key === '<') { e.preventDefault(); fmt('smaller'); }
  }
});

// テキストフォーマット
function fmt(a) {
  if (!focused) return;
  focused.focus();
  if (a === 'bold') document.execCommand('bold');
  else if (a === 'underline') document.execCommand('underline');
  else if (a === 'larger' || a === 'smaller') {
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && !sel.isCollapsed) {
      const delta = a === 'larger' ? 2 : -2;
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      try {
        range.surroundContents(span);
        span.style.fontSize = (parseFloat(getComputedStyle(span).fontSize) + delta) + 'px';
      } catch(e) {
        const frag = range.extractContents();
        span.appendChild(frag);
        span.style.fontSize = (parseFloat(getComputedStyle(focused).fontSize) + delta) + 'px';
        range.insertNode(span);
      }
    }
  }
}

// 検索
function doSearch() {
  const q = $('search').value.trim();
  if (q) {
    window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank');
    $('search').value = '';
  }
}

// アラート
function showAlert(title, msg) {
  $('alert-title').textContent = title;
  $('alert-msg').textContent = msg;
  $('alert').classList.add('show');
}
function hideAlert() { 
  $('alert').classList.remove('show'); 
}

// 統計
let stats = JSON.parse(localStorage.getItem('work-stats') || '{"sessions":0,"minutes":0,"today":0,"lastDate":"","streak":0}');

function updateStats() {
  const today = new Date().toDateString();
  if (stats.lastDate !== today) {
    if (stats.today > 0) {
      const lastD = new Date(stats.lastDate);
      const todayD = new Date(today);
      const diff = Math.floor((todayD - lastD) / (1000 * 60 * 60 * 24));
      if (diff === 1) stats.streak++;
      else if (diff > 1) stats.streak = 1;
    }
    stats.today = 0;
    stats.lastDate = today;
  }
  localStorage.setItem('work-stats', JSON.stringify(stats));
}

function showStats() {
  play('snd-click');
  updateStats();
  $('stat-sessions').textContent = stats.sessions;
  $('stat-minutes').textContent = stats.minutes;
  $('stat-today').textContent = stats.today;
  $('stat-streak').textContent = stats.streak;
  $('stats-modal').classList.add('show');
}

function hideStats() {
  play('snd-click');
  $('stats-modal').classList.remove('show');
}

// 設定
let sets = JSON.parse(localStorage.getItem('sets') || '{"work":25,"break":5,"repeat":0}');
$('set-work').value = sets.work;
$('set-break').value = sets.break;
$('set-repeat').value = sets.repeat;

function showSettings() {
  play('snd-click');
  $('settings').classList.add('show');
}

function saveSettings() {
  play('snd-click');
  sets.work = parseInt($('set-work').value) || 25;
  sets.break = parseInt($('set-break').value) || 5;
  sets.repeat = parseInt($('set-repeat').value) || 0;
  localStorage.setItem('sets', JSON.stringify(sets));
  pomoT = sets.work;
  shortT = sets.break;
  if (timerType === 'pomodoro') timeLeft = pomoT * 60;
  else if (timerType === 'short') timeLeft = shortT * 60;
  updateTimer();
  hideSettings();
}

function hideSettings() {
  play('snd-click');
  $('settings').classList.remove('show');
}

// アプリ設定
function showAppSettings() {
  play('snd-click');
  const savedColor = localStorage.getItem('text-color') || '#ffffff';
  $('text-color').value = savedColor;
  $('app-settings').classList.add('show');
}

function hideAppSettings() {
  play('snd-click');
  const color = $('text-color').value;
  localStorage.setItem('text-color', color);
  document.documentElement.style.setProperty('--text', color);
  $('app-settings').classList.remove('show');
}

// 保存された色を適用
const savedColor = localStorage.getItem('text-color');
if (savedColor) {
  document.documentElement.style.setProperty('--text', savedColor);
}

// Pomodoro Timer
let pomoT = sets.work, shortT = sets.break, longT = 15;
let timerType = 'pomodoro', timeLeft = pomoT * 60, timerInt = null, timerRun = false;
let cycles = 0, isWork = true, initialTime = pomoT * 60;

function updateTimer() {
  const str = fmtTime(timeLeft);
  $('timer').textContent = str;
  $('float-timer-time').textContent = str;
  const progress = (timeLeft / initialTime) * 100;
  $('progress-bar').style.width = progress + '%';
  $('current-session').textContent = cycles;
  $('total-today').textContent = stats.today;
  $('next-break').textContent = isWork ? fmtTime(shortT * 60) : fmtTime(pomoT * 60);
}

function switchTimer(type) {
  if (timerRun) {
    clearInterval(timerInt);
    timerRun = false;
    $('start').textContent = 'Start';
    updatePlayButtonIcon(false);
  }
  timerType = type;
  document.body.className = type === 'short' ? 'short-break' : type === 'long' ? 'long-break' : '';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[type === 'pomodoro' ? 0 : type === 'short' ? 1 : 2].classList.add('active');
  isWork = type === 'pomodoro';
  timeLeft = initialTime = type === 'pomodoro' ? pomoT * 60 : type === 'short' ? shortT * 60 : longT * 60;
  updateTimer();
}

function updatePlayButtonIcon(playing) {
  const quickBtn = $('quick-play-svg');
  if (playing) {
    quickBtn.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    quickBtn.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  }
}

function toggleTimer() {
  play('snd-click');
  if (timerRun) {
    clearInterval(timerInt);
    timerRun = false;
    $('start').textContent = 'Start';
    updatePlayButtonIcon(false);
  } else {
    timerRun = true;
    $('start').textContent = 'Pause';
    updatePlayButtonIcon(true);
    timerInt = setInterval(() => {
      if (--timeLeft <= 0) {
        clearInterval(timerInt);
        timerRun = false;
        $('start').textContent = 'Start';
        updatePlayButtonIcon(false);
        if (isWork) {
          cycles++;
          stats.sessions++;
          stats.today++;
          stats.minutes += pomoT;
          updateStats();
          play('snd-pomo');
          showAlert('作業完了！', '休憩時間です');
          if (sets.repeat === 0 || cycles < sets.repeat) {
            setTimeout(() => { switchTimer('short'); toggleTimer(); }, 3000);
          }
        } else {
          play('snd-timer');
          showAlert('休憩終了！', '次の作業を始めましょう');
          if (sets.repeat === 0 || cycles < sets.repeat) {
            setTimeout(() => { switchTimer('pomodoro'); toggleTimer(); }, 3000);
          }
        }
      }
      updateTimer();
    }, 1000);
  }
}

function resetTimer() {
  play('snd-click');
  if (timerRun) {
    clearInterval(timerInt);
    timerRun = false;
    $('start').textContent = 'Start';
    updatePlayButtonIcon(false);
  }
  cycles = 0;
  switchTimer(timerType);
}

// フローティング表示
function updateFloatDisplay() {
  const scrollTop = document.querySelector('.content').scrollTop;
  const shouldShow = scrollTop > 200;
  
  const timerShown = shouldShow && currentSection !== 'timer';
  const clockShown = shouldShow && currentSection !== 'clock';
  
  $('float-timer').classList.toggle('show', timerShown);
  $('float-clock').classList.toggle('show', clockShown);
  
  if (timerShown && clockShown) {
    $('float-clock').style.right = '180px';
  } else {
    $('float-clock').style.right = '24px';
  }
}

document.querySelector('.content').addEventListener('scroll', updateFloatDisplay);
window.addEventListener('resize', updateFloatDisplay);

// Custom Timer
let ctTime = 0, ctInt = null, ctRun = false, ctInitial = 0;
function updateCT() {
  $('ct').textContent = fmtTime3(ctTime);
  if (ctInitial > 0) {
    const progress = (ctTime / ctInitial) * 100;
    $('ct-progress').style.width = progress + '%';
  }
}
function toggleCT() {
  play('snd-click');
  if (ctRun) {
    clearInterval(ctInt);
    ctRun = false;
    $('ct-btn').textContent = 'Start';
  } else {
    if (ctTime === 0) {
      ctTime = ctInitial = (parseInt($('ct-h').value) || 0) * 3600 + (parseInt($('ct-m').value) || 0) * 60 + (parseInt($('ct-s').value) || 0);
      if (ctTime === 0) return alert('Please set the time');
    }
    ctRun = true;
    $('ct-btn').textContent = 'Pause';
    ctInt = setInterval(() => {
      if (--ctTime <= 0) {
        clearInterval(ctInt);
        ctRun = false;
        ctTime = 0;
        ctInitial = 0;
        $('ct-btn').textContent = 'Start';
        play('snd-timer');
        showAlert('Time Up！', 'カスタムタイマーが終了しました');
      }
      updateCT();
    }, 1000);
  }
}
function resetCT() {
  play('snd-click');
  clearInterval(ctInt);
  ctRun = false;
  ctTime = 0;
  ctInitial = 0;
  $('ct-btn').textContent = 'Start';
  $('ct-h').value = $('ct-m').value = $('ct-s').value = 0;
  updateCT();
}

// Stopwatch
let swTime = 0, swInt = null, swRun = false, lapCnt = 0;
function updateSW() { $('sw').textContent = fmtTime3(swTime); }
function toggleSW() {
  play('snd-click');
  if (swRun) {
    clearInterval(swInt);
    swRun = false;
    $('sw-btn').textContent = 'Start';
  } else {
    swRun = true;
    $('sw-btn').textContent = 'Pause';
    swInt = setInterval(() => { swTime++; updateSW(); }, 1000);
  }
}
function lapSW() {
  if (swRun) {
    play('snd-lap');
    const lap = document.createElement('div');
    lap.className = 'lap-item';
    lap.innerHTML = `<span>Lap ${++lapCnt}</span><span>${fmtTime3(swTime)}</span>`;
    $('laps').insertBefore(lap, $('laps').firstChild);
  }
}
function resetSW() {
  play('snd-click');
  clearInterval(swInt);
  swRun = false;
  swTime = lapCnt = 0;
  $('sw-btn').textContent = 'Start';
  $('laps').innerHTML = '';
  updateSW();
}

// Calculator
let calcStr = '0', calcPrev = 0, calcOp = null, calcNew = true;
let calcHistory = JSON.parse(localStorage.getItem('calc-history') || '[]');

function renderCalcHistory() {
  const historyEl = $('calc-history');
  if (calcHistory.length === 0) {
    historyEl.style.display = 'none';
    return;
  }
  historyEl.style.display = 'block';
  historyEl.innerHTML = calcHistory.slice(-10).reverse().map(h => 
    `<div class="calc-history-item">${h}</div>`
  ).join('');
}

function addToCalcHistory(expr, result) {
  calcHistory.push(`${expr} = ${result}`);
  localStorage.setItem('calc-history', JSON.stringify(calcHistory));
  renderCalcHistory();
}

function calcInput(v) {
  play('snd-click');
  if (calcNew && !isNaN(v)) {
    calcStr = v;
    calcNew = false;
  } else if (['+','-','*','/','%'].includes(v)) {
    calcPrev = parseFloat(calcStr);
    calcOp = v;
    calcNew = true;
  } else {
    calcStr = calcStr === '0' ? v : calcStr + v;
  }
  $('calc-display').textContent = calcStr;
}

function calcEquals() {
  play('snd-click');
  const curr = parseFloat(calcStr);
  let result = curr;
  let expr = `${calcPrev} ${calcOp} ${curr}`;
  if (calcOp === '+') result = calcPrev + curr;
  else if (calcOp === '-') result = calcPrev - curr;
  else if (calcOp === '*') result = calcPrev * curr;
  else if (calcOp === '/') result = calcPrev / curr;
  else if (calcOp === '%') result = calcPrev % curr;
  
  if (calcOp) {
    addToCalcHistory(expr, result);
  }
  
  calcStr = String(result);
  $('calc-display').textContent = calcStr;
  calcNew = true;
  calcOp = null;
}

function calcBackspace() {
  play('snd-click');
  if (calcStr.length > 1) {
    calcStr = calcStr.slice(0, -1);
  } else {
    calcStr = '0';
  }
  $('calc-display').textContent = calcStr;
}

function clearCalc() {
  play('snd-click');
  calcStr = '0';
  calcPrev = 0;
  calcOp = null;
  calcNew = true;
  $('calc-display').textContent = '0';
}

// キーボード入力対応
document.addEventListener('keydown', (e) => {
  if (currentSection === 'calculator' && e.target.tagName !== 'INPUT' && e.target.contentEditable !== 'true') {
    if (!isNaN(e.key)) calcInput(e.key);
    else if (e.key === '.') calcInput('.');
    else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') calcInput(e.key);
    else if (e.key === 'Enter') calcEquals();
    else if (e.key === 'Escape' || e.key === 'c') clearCalc();
    else if (e.key === 'Backspace') calcBackspace();
  }
});

renderCalcHistory();

// Memo
const memo = $('memo');
const memoFiles = {};
if (localStorage.memo) memo.innerHTML = localStorage.memo;
if (localStorage.memoFiles) {
  try {
    Object.assign(memoFiles, JSON.parse(localStorage.memoFiles));
  } catch(e) {}
}

function saveMemo() {
  localStorage.memo = memo.innerHTML;
}

function clearMemo() {
  if (confirm('Clear all notes?')) {
    memo.innerHTML = '';
    localStorage.removeItem('memo');
    Object.keys(memoFiles).forEach(k => delete memoFiles[k]);
    localStorage.removeItem('memoFiles');
    renderMemoFiles();
  }
}

function handleMemoFile(e) {
  const files = e.target.files;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      memoFiles[id] = {
        name: file.name,
        type: file.type,
        data: ev.target.result
      };
      localStorage.memoFiles = JSON.stringify(memoFiles);
      renderMemoFiles();
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.className = 'memo-image';
        img.onclick = () => window.open(ev.target.result, '_blank');
        memo.appendChild(img);
        saveMemo();
      }
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function renderMemoFiles() {
  const container = $('memo-files');
  container.innerHTML = '';
  Object.entries(memoFiles).forEach(([id, file]) => {
    const div = document.createElement('div');
    div.className = 'memo-file';
    div.innerHTML = `
      <span>${file.name}</span>
      <button class="memo-file-remove" onclick="removeMemoFile('${id}')">×</button>
    `;
    div.onclick = e => {
      if (e.target.tagName !== 'BUTTON') {
        if (file.type.startsWith('image/')) {
          window.open(file.data, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = file.data;
          a.download = file.name;
          a.click();
        }
      }
    };
    container.appendChild(div);
  });
}

function removeMemoFile(id) {
  delete memoFiles[id];
  localStorage.memoFiles = JSON.stringify(memoFiles);
  renderMemoFiles();
}

function insertLink() {
  const url = prompt('Enter URL:');
  if (url) {
    const name = prompt('Enter link name:') || url;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.textContent = name;
    a.style.cssText = 'color:#2bac76;text-decoration:underline;';
    memo.appendChild(a);
    memo.appendChild(document.createTextNode(' '));
    saveMemo();
  }
}

renderMemoFiles();

// Clock
function updateClocks() {
  const now = new Date();
  const t = fmtTime3(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
  $('time').textContent = t;
  $('float-clock-time').textContent = t;
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  $('date').textContent = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} (${wd})`;
  const getTZ = tz => {
    const d = new Date(now.toLocaleString('en-US', {timeZone: tz}));
    return fmtTime3(d.getHours()*3600+d.getMinutes()*60+d.getSeconds());
  };
  $('tokyo').textContent = getTZ('Asia/Tokyo');
  $('ny').textContent = getTZ('America/New_York');
  $('london').textContent = getTZ('Europe/London');
}
updateClocks();
setInterval(updateClocks, 1000);

// Weather
function loadWeather() {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=35.85272206403399&lon=136.28673448772105&appid=8eb6dc5492a964ea79dd0ef92f1ae01c&units=metric&lang=ja`)
    .then(r => r.json())
    .then(d => {
      $('w-icon').src = `./weather-svg/${d.weather[0].icon}.svg`;
      $('w-icon').style.display = 'block';
      $('w-desc').textContent = d.weather[0].description;
      $('w-temp').textContent = Math.round(d.main.temp) + '°';
      $('w-max').textContent = Math.round(d.main.temp_max);
      $('w-min').textContent = Math.round(d.main.temp_min);
      $('w-loc').textContent = d.name || '指定地点';
      
      // iframeを再読み込み
      const iframe = $('weather-iframe');
      iframe.src = iframe.src;
    })
    .catch(e => { 
      $('w-desc').textContent = 'Error loading weather'; 
    });
}
loadWeather();
setInterval(loadWeather, 1800000);

// Gemini
function sendGemini() {
  const msg = $('gemini').textContent.trim();
  if (!msg) return;
  $('gemini').textContent = '';
  console.log('Message sent to Gemini:', msg);
}

// Notion
let notionPages = JSON.parse(localStorage.getItem('notion-pages') || JSON.stringify([
  {name:'Tasks',url:'https://todolist-home.notion.site/ebd//2c9ee93cc3e4800aba3ef91a7b2b0a31?v=2c9ee93cc3e480868d75000c8bfe4b7d'},
  {name:'Notes',url:'https://todolist-home.notion.site/ebd//2c9ee93cc3e480d0a9feecd8ab2bc460'}
]));
let notionIdx = 0;

function renderNotionTabs() {
  const tabs = $('notion-tabs');
  tabs.innerHTML = '';
  notionPages.forEach((page, idx) => {
    const btn = document.createElement('button');
    btn.className = 'notion-tab' + (idx === notionIdx ? ' active' : '');
    btn.textContent = page.name;
    btn.onclick = () => switchNotionPage(idx);
    tabs.appendChild(btn);
  });
  if (notionPages.length < 5) {
    const add = document.createElement('button');
    add.className = 'notion-tab notion-add';
    add.textContent = '+ Add';
    add.onclick = addNotionPage;
    tabs.appendChild(add);
  }
}

function switchNotionPage(idx) {
  play('snd-click');
  notionIdx = idx;
  $('notion').src = notionPages[idx].url;
  renderNotionTabs();
}

function addNotionPage() {
  if (notionPages.length >= 5) return alert('Maximum 5 pages');
  const url = prompt('Enter Notion page URL:');
  if (url) {
    const name = prompt('Enter page name:') || 'Page ' + (notionPages.length + 1);
    notionPages.push({name, url});
    localStorage.setItem('notion-pages', JSON.stringify(notionPages));
    renderNotionTabs();
  }
}

renderNotionTabs();

// YouTube
let ytPlayer = null;
let ytPlaying = false;
let ytPlaylistId = '';

function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('yt-player', {
    height: '360',
    width: '640',
    playerVars: {
      'playsinline': 1,
      'controls': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  setYoutubeVolume(70);
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    ytPlaying = true;
    updateYoutubePlayButton(true);
  } else {
    ytPlaying = false;
    updateYoutubePlayButton(false);
  }
}

function updateYoutubePlayButton(playing) {
  const svg = $('yt-play-svg');
  if (playing) {
    svg.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    svg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  }
  
  const fixedSvg = document.querySelector('#youtube-fixed-controls svg');
  if (fixedSvg) {
    if (playing) {
      $('yt-play-icon').style.display = 'none';
      $('yt-pause-icon').style.display = 'block';
      $('yt-pause-icon2').style.display = 'block';
    } else {
      $('yt-play-icon').style.display = 'block';
      $('yt-pause-icon').style.display = 'none';
      $('yt-pause-icon2').style.display = 'none';
    }
  }
}

function loadYoutubePlaylist() {
  const url = $('yt-playlist').value.trim();
  if (!url) return alert('Please enter a playlist URL');
  
  const match = url.match(/[?&]list=([^&]+)/);
  if (!match) return alert('Invalid playlist URL');
  
  ytPlaylistId = match[1];
  
  if (ytPlayer && ytPlayer.loadPlaylist) {
    ytPlayer.loadPlaylist({
      list: ytPlaylistId,
      listType: 'playlist'
    });
    ytPlayer.playVideo();
  }
}

function toggleYoutubePlay() {
  if (!ytPlayer) return;
  if (ytPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}

function prevYoutube() {
  if (ytPlayer && ytPlayer.previousVideo) {
    ytPlayer.previousVideo();
  }
}

function nextYoutube() {
  if (ytPlayer && ytPlayer.nextVideo) {
    ytPlayer.nextVideo();
  }
}

function setYoutubeVolume(vol) {
  if (ytPlayer && ytPlayer.setVolume) {
    ytPlayer.setVolume(vol);
  }
  $('yt-vol-display').textContent = vol + '%';
  $('youtube-volume').value = vol;
  $('youtube-volume-fixed').value = vol;
}

// YouTube controls visibility
function updateYoutubeControls() {
  const ytControls = $('youtube-fixed-controls');
  if (currentSection === 'youtube') {
    ytControls.classList.remove('show');
  } else if (ytPlaying) {
    ytControls.classList.add('show');
  }
}

setInterval(updateYoutubeControls, 500);

// Responsive
if (window.innerWidth <= 1024) {
  $('mobile-menu').style.display = 'flex';
}

window.addEventListener('resize', () => {
  if (window.innerWidth <= 1024) {
    $('mobile-menu').style.display = 'flex';
  } else {
    $('mobile-menu').style.display = 'none';
    $('sidebar').classList.remove('open');
    $('mobile-overlay').classList.remove('show');
  }
});