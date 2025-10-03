let mines = 10;
const rows = 10,
      cols = 10;

const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

const getRandomPosition = () => [
    Math.floor(Math.random() * rows),
    Math.floor(Math.random() * cols)
];

let placedMines = 0;
while (placedMines < mines) {
    const [randomRow, randomCol] = getRandomPosition();
    if (grid[randomRow][randomCol] !== -1) {
        grid[randomRow][randomCol] = -1;
        placedMines++;
    }
}

const inBounds = (row, col) => row >= 0 && row < rows && col >= 0 && col < cols;

const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        if (grid[row][col] === -1) continue;
        let neighborMineCount = 0;
        for (const [deltaRow, deltaCol] of directions) {
            const neighborRow = row + deltaRow, neighborCol = col + deltaCol;
            if (inBounds(neighborRow, neighborCol) && grid[neighborRow][neighborCol] === -1) {
                neighborMineCount++;
            }
        }
        grid[row][col] = neighborMineCount;
    }
}

console.log(grid);
