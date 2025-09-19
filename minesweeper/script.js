document.addEventListener('DOMContentLoaded', () => {
  // === ЕЛЕМЕНТИ ===
  const boardEl = document.getElementById('board');
  const btnStart = document.getElementById('start');
  const btnTheme = document.getElementById('theme');
  const flagsEl = document.getElementById('flags');
  const timerEl = document.getElementById('timer');
  const bestEl  = document.getElementById('best');
  const modal = document.getElementById('modal');
  const modalText = document.getElementById('modal-text');

  const difficultySel = document.getElementById('difficulty');
  const customWrap = document.getElementById('custom-controls');
  const widthInp = document.getElementById('width');
  const heightInp = document.getElementById('height');
  const minesInp = document.getElementById('mines');

  // === СТАН ===
  let W = 16, H = 16, M = 40;           // розмір поля і міни (за замовчуванням Medium)
  let board = [];                        // масив осередків
  let cells = [];                        // DOM
  let firstClickDone = false;
  let gameOver = false;
  let flagsPlaced = 0;
  let sec = 0, tInt = null;

  // зручний ключ для рекордів
  const bestKey = () => `ms-best-${W}x${H}-${M}`;

  // === ДОПОМОЖНІ ===
  const pad = n => String(n).padStart(2, '0');
  const setFlagsLeft = () => flagsEl.textContent = String(M - flagsPlaced).padStart(3,'0');
  const setTimer = (s) => timerEl.textContent = `${pad(Math.floor(s/60))}:${pad(s%60)}`;
  const startTimer = () => {
    clearInterval(tInt);
    tInt = setInterval(()=>{ sec++; setTimer(sec); }, 1000);
  };
  const stopTimer = () => clearInterval(tInt);

  const showBest = () => {
    const v = localStorage.getItem(bestKey());
    bestEl.textContent = v ? formatTime(+v) : '—';
  };
  const formatTime = (s)=> `${pad(Math.floor(s/60))}:${pad(s%60)}`;

  function diffApply() {
    const val = difficultySel.value;
    if (val === 'easy'){ W=9; H=9; M=10; customWrap.classList.add('hidden'); }
    else if (val === 'medium'){ W=16; H=16; M=40; customWrap.classList.add('hidden'); }
    else if (val === 'hard'){ W=30; H=16; M=99; customWrap.classList.add('hidden'); }
    else {
      customWrap.classList.remove('hidden');
      // підхопити з інпутів, обмежити міни
      W = clamp(+widthInp.value || 10, 5, 40);
      H = clamp(+heightInp.value || 10, 5, 30);
      const maxM = Math.max(1, W*H-1);
      M = clamp(+minesInp.value || 15, 1, maxM);
      minesInp.max = maxM;
    }
  }
  const clamp = (v,min,max)=> Math.min(max, Math.max(min, v));

  difficultySel.addEventListener('change', () => { diffApply(); newGame(); });
  [widthInp, heightInp, minesInp].forEach(inp => {
    inp.addEventListener('input', () => { if (difficultySel.value==='custom'){ diffApply(); newGame(); }});
  });

  // === ЛОГІКА ПОЛЯ ===
  function idx(r,c){ return r*W + c; }
  function inBounds(r,c){ return r>=0 && r<H && c>=0 && c<W; }
  function neighbors(k){
    const r = Math.floor(k/W), c = k%W;
    const res=[];
    for(let dr=-1; dr<=1; dr++){
      for(let dc=-1; dc<=1; dc++){
        if(dr===0 && dc===0) continue;
        const nr=r+dr, nc=c+dc;
        if(inBounds(nr,nc)) res.push(idx(nr,nc));
      }
    }
    return res;
  }

  function makeBoard(){
    board = Array.from({length: W*H}, ()=>({
      isMine:false, open:false, flag:false, n:0
    }));
  }

  function placeMines(excludeIndex){
    // Розкидуємо M мін, уникаючи excludeIndex (та, бажано, його сусідів — якісний UX)
    const forbidden = new Set([excludeIndex, ...neighbors(excludeIndex)]);
    let placed = 0;
    while(placed < M){
      const k = Math.floor(Math.random() * board.length);
      if (forbidden.has(k) || board[k].isMine) continue;
      board[k].isMine = true;
      placed++;
    }
    // Порахувати числа
    for(let i=0;i<board.length;i++){
      if(board[i].isMine){ board[i].n=0; continue; }
      board[i].n = neighbors(i).reduce((acc,j)=> acc + (board[j].isMine?1:0), 0);
    }
  }

  function renderBoard(){
    boardEl.innerHTML='';
    boardEl.style.setProperty('--cols', W);
    cells = board.map((cell, i)=>{
      const div = document.createElement('button');
      div.type='button';
      div.className='cell closed';
      div.setAttribute('role','gridcell');
      div.setAttribute('aria-label', 'Закрита клітинка');
      div.dataset.i = i;
      // події
      div.addEventListener('click', onLeftClick);
      div.addEventListener('contextmenu', e=>{ e.preventDefault(); toggleFlag(i); });
      // мобільний довгий тап на прапорець
      attachLongPress(div, ()=> toggleFlag(i));
      // клавіатура
      div.addEventListener('keydown', (e)=> onCellKey(e, i));
      boardEl.appendChild(div);
      return div;
    });
  }

  function attachLongPress(el, cb){
    let t; const th=400;
    el.addEventListener('touchstart', ()=>{ t=setTimeout(cb, th); }, {passive:true});
    el.addEventListener('touchend', ()=> clearTimeout(t));
    el.addEventListener('touchmove', ()=> clearTimeout(t));
  }

  function openCell(i, viaChord=false){
    const cell = board[i];
    const node = cells[i];
    if (cell.open || cell.flag || gameOver) return;

    // перший хід — безпечний: тут розмістимо міни
    if (!firstClickDone){
      firstClickDone = true;
      placeMines(i);
      startTimer();
    }

    cell.open = true;
    node.classList.remove('closed');
    node.classList.add('open');
    node.setAttribute('aria-label', cell.isMine ? 'Міна' : (cell.n ? `Цифра ${cell.n}` : 'Порожньо'));

    if (cell.isMine){
      node.classList.add('mine','exploded','revealed');
      endGame(false, i);
      return;
    }
    if (cell.n>0){
      node.textContent = cell.n;
      node.classList.add(`num-${cell.n}`);
    } else {
      // flood fill BFS
      const q=[i];
      while(q.length){
        const k=q.shift();
        neighbors(k).forEach(n=>{
          const c = board[n];
          if (c.open || c.flag || c.isMine) return;
          c.open = true;
          const nd = cells[n];
          nd.classList.remove('closed');
          nd.classList.add('open');
          if (c.n>0){
            nd.textContent = c.n;
            nd.classList.add(`num-${c.n}`);
          } else {
            q.push(n);
          }
        });
      }
    }

    // chord: якщо прийшли з кліку по цифрі — розкриймо сусідів, якщо прапорців рівно n
    if (viaChord){
      // нічого додатково — already done; логіка в onChordClick
    }

    checkWin();
  }

  function toggleFlag(i){
    if (gameOver) return;
    const cell = board[i];
    if (cell.open) return;
    cell.flag = !cell.flag;
    cells[i].classList.toggle('flag', cell.flag);
    cells[i].setAttribute('aria-label', cell.flag ? 'Прапорець' : 'Закрита клітинка');
    flagsPlaced += cell.flag ? 1 : -1;
    setFlagsLeft();
  }

  function onLeftClick(e){
    const i = +e.currentTarget.dataset.i;
    const cell = board[i];

    // chord (клік по відкритій цифрі): якщо прапорців навколо = числу — відкрити сусідів
    if (cell.open && !cell.isMine && cell.n>0){
      onChordClick(i);
      return;
    }

    openCell(i);
  }

  function onChordClick(i){
    const around = neighbors(i);
    const flags = around.filter(k=> board[k].flag).length;
    if (flags !== board[i].n) return;
    around.forEach(k=>{
      if (!board[k].flag && !board[k].open){
        openCell(k, true);
      }
    });
  }

  function revealAllMines(explodedIndex){
    board.forEach((c, i)=>{
      if (c.isMine){
        const n = cells[i];
        n.classList.add('mine','revealed');
        if (i===explodedIndex) n.classList.add('exploded');
      }
    });
  }

  function checkWin(){
    // виграш — усі немінні клітинки відкриті
    const toOpen = W*H - M;
    const opened = board.reduce((a,c)=> a + (c.open && !c.isMine ? 1 : 0), 0);
    if (opened === toOpen){
      endGame(true);
    }
  }

  function endGame(win, explodedIndex=-1){
    gameOver = true;
    stopTimer();
    if (!win){
      revealAllMines(explodedIndex);
      modalText.textContent = `💥 Програш! Ви натрапили на міну. Час: ${formatTime(sec)}`;
      modal.showModal();
      btnStart.textContent = '😵 Заново';
    } else {
      // зберегти рекорд
      const key = bestKey();
      const prev = localStorage.getItem(key);
      if (prev === null || +prev > sec) localStorage.setItem(key, String(sec));
      showBest();
      modalText.textContent = `🎉 Перемога! Час: ${formatTime(sec)}`;
      modal.showModal();
      btnStart.textContent = '🏆 Ще раз';
    }
  }

  // Клавіатура: стрілки — переміщення фокуса; Enter/Space — відкрити; F — прапорець
  function onCellKey(e, i){
    const r = Math.floor(i/W), c = i%W;
    let ni = i;
    if (e.key === 'ArrowLeft') ni = idx(r, Math.max(0,c-1));
    else if (e.key === 'ArrowRight') ni = idx(r, Math.min(W-1,c+1));
    else if (e.key === 'ArrowUp') ni = idx(Math.max(0,r-1), c);
    else if (e.key === 'ArrowDown') ni = idx(Math.min(H-1,r+1), c);
    else if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); onLeftClick({currentTarget: cells[i]}); return; }
    else if (e.key.toLowerCase() === 'f'){ e.preventDefault(); toggleFlag(i); return; }
    if (ni !== i) cells[ni].focus();
  }

  // === НОВА ГРА ===
  function newGame(){
    sec=0; setTimer(0);
    flagsPlaced=0; setFlagsLeft();
    stopTimer();
    firstClickDone = false;
    gameOver = false;
    btnStart.textContent = '🙂 Нова гра';
    makeBoard();
    renderBoard();
    showBest();
  }

  // === ТЕМА ===
  btnTheme.addEventListener('click', ()=>{
    const root = document.documentElement;
    const d = root.classList.toggle('dark');
    localStorage.setItem('ms-theme', d ? 'dark' : 'light');
  });
  // ініціалізація теми
  if (localStorage.getItem('ms-theme')==='dark') document.documentElement.classList.add('dark');

  // запуск
  diffApply();
  newGame();

  btnStart.addEventListener('click', newGame);

  // для доступності — фокус на поле
  boardEl.addEventListener('click', ()=> boardEl.focus(), {capture:true});

  // вимкнути нативне контекстне меню на полі
  boardEl.addEventListener('contextmenu', e=> e.preventDefault());
});
