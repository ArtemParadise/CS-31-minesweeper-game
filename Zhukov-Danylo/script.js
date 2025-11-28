const boardEl = document.getElementById('board');
const minesEl = document.getElementById('mines');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('reset');
const newBtn = document.getElementById('new');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const minesInput = document.getElementById('minesInput');

let rows = 10, cols = 10, mines = 15;
let grid = [];
let firstClick = true;
let timer = null;
let seconds = 0;
let flags = 0;

function startTimer(){
	if(timer) return;
	seconds = 0; timerEl.textContent = formatTime(seconds);
	timer = setInterval(()=>{ seconds++; timerEl.textContent = formatTime(seconds); },1000);
}
function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } }
function formatTime(s){ return String(Math.min(s,999)).padStart(3,'0'); }

function setControls(){ rows = parseInt(rowsInput.value,10); cols = parseInt(colsInput.value,10); mines = Math.max(1, Math.min(parseInt(minesInput.value,10), rows*cols-1)); minesInput.value = mines; minesEl.textContent = String(mines-flags).padStart(3,'0'); }

function newGame(){ setControls(); grid = []; firstClick=true; flags=0; stopTimer(); timerEl.textContent = formatTime(0); resetBtn.textContent='🙂';
	boardEl.innerHTML='';
	boardEl.style.gridTemplateColumns = `repeat(${cols}, 24px)`;
	for(let r=0;r<rows;r++){
		const row=[];
		for(let c=0;c<cols;c++){
			const cell = { r, c, mine:false, adj:0, uncovered:false, flagged:false, el:null };
			row.push(cell);
			const div = document.createElement('div');
			div.className='cell';
			div.dataset.r=r; div.dataset.c=c;
			div.oncontextmenu = (e)=>{ e.preventDefault(); toggleFlag(cell); };
			div.onclick = (e)=>{ clickCell(cell); };
			div.ondblclick = (e)=>{ chord(cell); };
			cell.el = div;
			boardEl.appendChild(div);
		}
		grid.push(row);
	}
}

function placeMines(safeR,safeC){
	let placed=0;
	while(placed<mines){
		const r = Math.floor(Math.random()*rows);
		const c = Math.floor(Math.random()*cols);
		const cell = grid[r][c];
		// avoid placing on safe cell or neighbors
		if(cell.mine) continue;
		if(Math.abs(r-safeR)<=1 && Math.abs(c-safeC)<=1) continue;
		cell.mine=true; placed++;
	}
	// compute adj
	for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
		let count=0;
		for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
			if(dr===0 && dc===0) continue;
			const rr=r+dr, cc=c+dc;
			if(rr>=0 && rr<rows && cc>=0 && cc<cols && grid[rr][cc].mine) count++;
		}
		grid[r][c].adj = count;
	}
}

function clickCell(cell){
	if(cell.flagged || cell.uncovered) return;
	if(firstClick){ placeMines(cell.r,cell.c); startTimer(); firstClick=false; }
	reveal(cell);
	checkWin();
}

function reveal(cell){
	if(cell.uncovered || cell.flagged) return;
	cell.uncovered=true;
	cell.el.classList.add('uncovered');
	cell.el.classList.remove('flag');
	if(cell.mine){
		cell.el.textContent='💣';
		cell.el.classList.add('mine');
		gameOver(false);
		return;
	}
	if(cell.adj>0){
		cell.el.textContent=cell.adj;
		cell.el.classList.add('number-'+cell.adj);
	}else{
		// flood fill neighbors
		for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
			const rr=cell.r+dr, cc=cell.c+dc;
			if(rr>=0 && rr<rows && cc>=0 && cc<cols) reveal(grid[rr][cc]);
		}
	}
	cell.el.classList.add('disabled');
}

function toggleFlag(cell){
	if(cell.uncovered) return;
	cell.flagged = !cell.flagged;
	flags += cell.flagged?1:-1;
	minesEl.textContent = String(Math.max(0,mines-flags)).padStart(3,'0');
	cell.el.textContent = cell.flagged? '🚩':'';
	cell.el.classList.toggle('flag', cell.flagged);
}

function chord(cell){
	if(!cell.uncovered || cell.adj===0) return;
	// count flags around
	let f=0; let covered=[];
	for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
		const rr=cell.r+dr, cc=cell.c+dc;
		if(rr>=0 && rr<rows && cc>=0 && cc<cols){
			const n=grid[rr][cc]; if(n.flagged) f++; else if(!n.uncovered) covered.push(n);
		}
	}
	if(f===cell.adj){
		covered.forEach(c=> reveal(c));
		checkWin();
	}
}

function gameOver(won){
	stopTimer();
	boardEl.querySelectorAll('.cell').forEach(div=>div.classList.add('disabled'));
	if(!won){
		resetBtn.textContent='😵';
		// reveal all mines
		for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
			const cell = grid[r][c];
			if(cell.mine && !cell.uncovered){ cell.el.textContent='💣'; cell.el.classList.add('mine'); }
		}
	}else{
		resetBtn.textContent='😎';
	}
}

function checkWin(){
	let uncovered=0;
	for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
		if(grid[r][c].uncovered) uncovered++;
	}
	if(uncovered === rows*cols - mines){
		gameOver(true);
	}
}

resetBtn.onclick = ()=> newGame();
newBtn.onclick = ()=> newGame();

// initialize
minesInput.value = mines;
rowsInput.value = rows; colsInput.value = cols;
newGame();
