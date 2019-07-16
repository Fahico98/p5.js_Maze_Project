
const canvasWidth = 825, canvasHeight = 525;
const cols = 33, rows = 21;
const cellWidth = canvasWidth/cols, cellHeight = canvasHeight/rows;
const cellCols = 17, cellRows = 11;
var wallImage, starImage, current, cellsLoaded = false, playerPosX = 0, playerPosY = 0, grid = [], gridMemory = [], stack = [];
var collidersGrid = [], startPoint = {x: 32, y: 20}, ladronClicked = false, ladron;
var topConstrain, rightConstrain, bottomConstrain, leftConstrain, consX, consY, timer = 20, gameOver = false, youWin = false;

function preload() {
   wallImage = loadImage('images/wall.png');
   starImage = loadImage("images/7.png");
}

function setup() {
   createCanvas(canvasWidth, canvasHeight);
   background(0, 0, 0);
   frameRate(600);
   loadCells();
   putStar();
   current = grid[0];
   while(true){
      current.visited = true;
      var next = current.checkNeighbors();
      if(next){
         next.visited = true;
         stack.push(current);
         removeWalls(current, next);
         current = next;
      }else if(stack.length > 0){
         current = stack.pop();
      }else{
         fillCollidersGrid();
         ladron = new Ladron((startPoint.x * cellWidth) + 12, (startPoint.y * cellHeight) + 12);
         break;
      }
   }
}

function draw() {
   background(0, 0, 0);
   loadCells();
   putStar();
   for(var i = 0; i < gridMemory.length; i++){
      replaceWall(gridMemory[i].x, gridMemory[i].y);
   }
   if(!ladronClicked){
      ladron = new Ladron((startPoint.x * cellWidth) + 12, (startPoint.y * cellHeight) + 12);
   }else{
      var xTemp = ladron.x;
      var yTemp = ladron.y;
      if(floor(xTemp/cellWidth) == 0 && floor(yTemp/cellHeight) == 0){
         textSize(80);
         fill(255);
         text("YOU WIN...!", canvasWidth/2, canvasHeight/2);
         youWin = true;
      }
      if(gameOver || youWin){
         ladron = new Ladron(xTemp, yTemp);
      }else{
         ladron = new Ladron(getConstrains(xTemp, yTemp).x, getConstrains(xTemp, yTemp).y);
      }
      if (frameCount % 60 == 0 && timer > 0 && !gameOver && !youWin) {
         timer--;
      }
      if (timer == 0) {
         textSize(80);
         fill(255);
         text("GAME OVER", canvasWidth/2, canvasHeight/2);
         gameOver = true;
      }
      textAlign(CENTER, CENTER);
      textSize(20);
      fill(255);
      text(timer, 811, 14);
   }
}

function mouseClicked(){
   if((startPoint.x * cellWidth) < mouseX  && (startPoint.x + 1) * cellWidth > mouseX){
      if((startPoint.y * cellHeight) < mouseY && (startPoint.y + 1) * cellHeight > mouseY){
         ladronClicked = true;
      }
   }
   if(gameOver){
      gameOver = false;
      ladronClicked = false;
      timer = 20;
      setup();
   }
   if(youWin){
      grid = [];
      stack = [];
      gridMemory = [];
      loadCells();
      timer = 20;
      youWin = false;
      ladronClicked = false;
      setup();
   }
}

function getConstrains(x, y){
   var Xright; var Xleft; var Ytop; var Ybottom;
   var gridX = floor(x/cellWidth), gridY = floor(y/cellHeight);
   var top = (gridY - 1 < 0) ? false : collidersGrid[gridX][gridY - 1];
   var right = (gridX + 1 > 32) ? false : collidersGrid[gridX + 1][gridY];
   var bottom = (gridY + 1 > 20) ? false : collidersGrid[gridX][gridY + 1];
   var left = (gridX - 1 < 0) ? false : collidersGrid[gridX - 1][gridY];
   Ytop = (top) ? ((gridY - 1) * cellHeight) + 12 : (gridY * cellHeight) + 12;
   Ybottom = (bottom) ? ((gridY + 2) * cellHeight) - 12 : ((gridY + 1) * cellHeight) - 12;
   Xright = (right) ? ((gridX + 2) * cellHeight) - 12 : ((gridX + 1) * cellHeight) - 12;
   Xleft = (left) ? ((gridX - 1) * cellWidth) + 12 : (gridX * cellWidth) + 12;
   return {x: constrain(mouseX, Xleft, Xright), y: constrain(mouseY, Ytop, Ybottom)};
}

function putWall(posX, posY){
   image(wallImage, posX, posY, cellWidth, cellHeight, 0, 0, 0, 0);
}

function putStar(){
   image(starImage, 0, 0, cellWidth - 2, cellHeight - 2, 0, 0, 0, 0);
}

function loadCells(){
   for(var y = 1; y < rows; y += 2){
      for(var x = 0; x < cols; x ++){
         putWall(x * cellWidth, y * cellHeight);
      }
   }
   for(var y = 0; y < rows; y += 2){
      for(var x = 1; x < cols; x += 2){
         putWall(x * cellWidth, y * cellHeight);
      }
   }
   makeMaze();
}

function makeMaze(){
   for(var y = 0; y < cellRows; y++){
      for(var x = 0; x < cellCols; x++){
         grid.push(new Cell(x, y));
      }
   }
}

function fillCollidersGrid(){
   for(let x = 0; x < cols; x++){
      collidersGrid[x] = [];
      for (let y = 0; y < rows; y++) {
         collidersGrid[x][y] = (x % 2 == 0 && y % 2 == 0);
      }
   }
   if(gridMemory.length > 0){
      for (let i = 0; i < gridMemory.length; i++){
         collidersGrid[gridMemory[i].x][gridMemory[i].y] = true;
      }
   }
}

function index(x, y){
   return (x < 0 || y < 0 || x > cellCols - 1 || y > cellRows - 1) ? -1 : x + (y * cellCols);
}

function Cell(x, y){
   this.x = x;
   this.y = y;
   this.wallsToRemove = [false, false, false, false];
   this.visited = false;
   this.checkNeighbors = function(){
      var neighbors     = [];
      var top           = grid[index(x, y - 1)];
      var right         = grid[index(x + 1, y)];
      var bottom        = grid[index(x, y + 1)];
      var left          = grid[index(x - 1, y)];
      if(top && !top.visited){
         neighbors.push(top);
      }
      if(right && !right.visited){
         neighbors.push(right);
      }
      if(bottom && !bottom.visited){
         neighbors.push(bottom);
      }
      if(left && !left.visited){
         neighbors.push(left);
      }
      if(neighbors.length > 0){
         var r = floor(random(0, neighbors.length));
         return neighbors[r];
      }else{
         return undefined;
      }
   }
}

function replaceWall(x, y, wallLocation = ""){
   var xWall = x;
   var yWall = y;
   if(wallLocation === "left"){
      xWall--;
   }else if(wallLocation === "right"){
      xWall++;
   }else if(wallLocation === "top"){
      yWall--;
   }else if(wallLocation === "bottom"){
      yWall++;
   }
   fill(0, 0, 0);
   square(xWall * cellWidth, yWall * cellWidth, cellWidth);
   if(wallLocation !== ""){
      gridMemory.push({x: xWall, y: yWall});
   }
}

function removeWalls(cell_1, cell_2){
   var xDifference = cell_1.x - cell_2.x;
   if(xDifference === 1){
      replaceWall(2 * cell_1.x, 2 * cell_1.y, "left");
   }else if(xDifference === -1){
      replaceWall(2 * cell_1.x, 2 * cell_1.y, "right");
   }
   var yDifference = cell_1.y - cell_2.y;
   if(yDifference === 1){
      replaceWall(2 * cell_1.x, 2 * cell_1.y, "top");
   }else if(yDifference === -1){
      replaceWall(2 * cell_1.x, 2 * cell_1.y, "bottom");
   }
}

// Ladrón
function Ladron(ladronX, ladronY){
   this.x = ladronX;
   this.y = ladronY;
   fill(255, 114, 0);
   ellipse(ladronX, ladronY, 22, 22);
   fill(255);
   ellipse(ladronX - 9, ladronY - 5, 10, 10);
   ellipse(ladronX, ladronY - 5, 10, 10);
   fill(0);
   ellipse(ladronX - 9, ladronY - 5, 5, 5);
   ellipse(ladronX, ladronY - 5, 5, 5);
   fill(0);
   //rect(ladronX - 10, ladronY+ 5, 1, 10);
   //rect(ladronX, ladronY + 5, 1, 10);
   //rect(ladronX + 10, ladronY + 5, 1, 10);
}