let  mines = 10;
const rows = 10,
      cols = 10;

const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

const getRandomPosition = () => [
    Math.floor(Math.random() * rows),
    Math.floor(Math.random() * cols)
];

let placedMines = 0;
while (placedMines < mines) {
    const [r, c] = getRandomPosition();
    if (grid[r][c] !== -1) {
        grid[r][c] = -1;
        placedMines++;
    }
}

const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;

const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];

for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        if (grid[r][c] === -1) continue;
        let count = 0;
        for (const [dr, dc] of directions) {
            const nr = r + dr, nc = c + dc;
            if (inBounds(nr, nc) && grid[nr][nc] === -1) count++;
        }
        grid[r][c] = count;
    }
}

console.log(grid)
