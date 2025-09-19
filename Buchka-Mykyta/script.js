// DOM element references for game components
const boardEl = document.getElementById('board');
const minesEl = document.getElementById('mines');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('reset');
const newBtn = document.getElementById('new');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const minesInput = document.getElementById('minesInput');

// Game configuration variables
let rows = 15, cols = 15, mines = 50;
let grid = [];           // 2D array holding cell objects
let firstClick = true;   // Tracks if it's the first move
let timer = null;        // Timer interval reference
let seconds = 0;         // Game duration in seconds
let flags = 0;          // Number of placed flags

// Timer management functions
function startTimer(){
	if(timer) return;
	seconds = 0; timerEl.textContent = formatTime(seconds);
	timer = setInterval(()=>{ seconds++; timerEl.textContent = formatTime(seconds); },1000);
}
function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } }
function formatTime(s){ return String(Math.min(s,999)).padStart(3,'0'); }

// Updates game settings from input fields
function setControls(){ 
	rows = parseInt(rowsInput.value,10); 
	cols = parseInt(colsInput.value,10); 
	mines = Math.max(1, Math.min(parseInt(minesInput.value,10), rows*cols-1)); 
	minesInput.value = mines; 
	minesEl.textContent = String(mines-flags).padStart(3,'0'); 
}

// Initializes a new game with current settings
function newGame(){ 
	// Create empty board and reset game state
	setControls(); 
	grid = []; 
	firstClick=true; 
	flags=0; 
	stopTimer(); 
	timerEl.textContent = formatTime(0); 
	resetBtn.textContent='🙂';

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

// Places mines randomly after first click
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

// Handles cell click events
function clickCell(cell){
	if(cell.flagged || cell.uncovered) return;
	if(firstClick){ placeMines(cell.r,cell.c); startTimer(); firstClick=false; }
	reveal(cell);
	checkWin();
}

// Reveals a cell and handles mine explosions or empty cell propagation
function reveal(cell){
    if(cell.uncovered || cell.flagged) return;
    cell.uncovered=true;
    cell.el.classList.add('uncovered');
    cell.el.classList.remove('flag');
    if(cell.mine){
        cell.el.textContent='💥';
        cell.el.classList.add('mine', 'exploded');
        gameOver(false, cell);
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

// Toggles flag on right-click
function toggleFlag(cell){
	if(cell.uncovered) return;
	cell.flagged = !cell.flagged;
	flags += cell.flagged?1:-1;
	minesEl.textContent = String(Math.max(0,mines-flags)).padStart(3,'0');
	cell.el.textContent = cell.flagged? '🚩':'';
	cell.el.classList.toggle('flag', cell.flagged);
}

// Handles double-click on numbers to reveal adjacent cells
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

// Handles end of game scenarios
function gameOver(won, explodedCell = null){
    stopTimer();
    boardEl.querySelectorAll('.cell').forEach(div=>div.classList.add('disabled'));
    if(!won){
        resetBtn.textContent='😵';
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
            const cell = grid[r][c];
            if(cell === explodedCell) continue;
            if(cell.mine && !cell.flagged){
                cell.el.textContent='💣';
                cell.el.classList.add('mine');
            }
            if(cell.flagged && !cell.mine){
                cell.el.classList.add('wrong-flag');
            }
        }
    }else{
        resetBtn.textContent='😎';
    }
}

// Checks if player has won
function checkWin(){
	let uncovered=0;
	for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
		if(grid[r][c].uncovered) uncovered++;
	}
	if(uncovered === rows*cols - mines){
		gameOver(true);
	}
}

// Event listeners for reset and new game buttons
resetBtn.onclick = ()=> newGame();
newBtn.onclick = ()=> newGame();

// Initial game setup
minesInput.value = mines;
rowsInput.value = rows; colsInput.value = cols;
newGame();