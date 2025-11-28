//Структура клітинки
function createCell(hasMine = false, adjacentMines = 0, state = "closed") {
    return {
        hasMine: hasMine,
        adjacentMines: adjacentMines,
        state: state
    };
}

//Структура поля
function createField(rows, cols) {
    const field = [];

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(createCell());
        }
        field.push(row);
    }

    return field;
}

//Структура гри
function createGameState(rows, cols, mines) {
    return {
        rows: rows,
        cols: cols,
        mines: mines,
        status: "in_progress",
        field: createField(rows, cols)
    };
}

const game = createGameState(4, 4, 3);

game.field[0][1].hasMine = true;
game.field[2][3].hasMine = true;
game.field[3][0].hasMine = true;

game.field[0][0].adjacentMines = 1;
game.field[0][2].adjacentMines = 1;
game.field[1][1].adjacentMines = 2;

game.field[1][1].state = "open";
game.field[2][2].state = "flag";

console.log("Поточний стан гри:", game);