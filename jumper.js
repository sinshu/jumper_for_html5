var SCR_WIDTH = 256;
var SCR_HEIGHT = 256;
var CELLS_ROWS = 20;
var CELLS_COLS = 20;
var FIELD_WIDTH = CELLS_COLS * 32;
var FIELD_HEIGHT = CELLS_ROWS * 32;

var WALL = 1;
var TOGE = 2;
var BANE = 3;
var EXIT = 4;

var PLAY_WIDTH = 16;
var PLAY_HEIGHT = 32;
var PLAY_ACCEL = 0.5;
var PLAY_POWER = 36;
var PLAY_JUMPLIM = 4;
var PLAY_GRAV = 0.625;
var PLAY_MAXVX = 4;
var PLAY_MAXVY = 16;

var BANE_POWER = 16;

var CANT_JUMP = 0;
var CAN_JUMP = 1;
var INIT_JUMP = 2;

var GAME_OVER = 1;
var GAME_CLEAR = 2;

var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz&+";

var cells;

var startRow;
var startCol;

var endRow;
var endCol;

var playX;
var playY;
var playPrevX;
var playPrevY;
var playVX;
var playVY;
var playLeft;
var playAnime;
var playOnWall;
var playJumpStat;
var playJumpCnt;

var gameStat;
var gameOverCnt;

var viewX;
var viewY;
var viewFix;

var keyLeft;
var keyRight;
var keySpace;

var imgPlayl;
var imgPlayr;
var imgWall;
var imtToge;
var imgBane;
var imgExit;
var imgBack;

var drawCanvas;
var drawContext;

var imageCount;

onload = function()
{
	drawCanvas = document.getElementById("draw_canvas");
	drawContext = drawCanvas.getContext("2d");
	drawContext.font = "12pt Arial";
	init();
};

function init()
{
	cells = new Array(CELLS_ROWS + 1);
	for (var i = 0; i < CELLS_ROWS + 1; i++)
	{
		cells[i] = new Array(CELLS_COLS);
		for (var j = 0; j < CELLS_COLS; j++)
		{
			if ((i == 0) || (i == CELLS_ROWS - 1) || (j == 0) || (j == CELLS_COLS - 1))
			{
				cells[i][j] = 1;
			}
			else
			{
				cells[i][j] = 0;
			}
		}
	}
	
	query = "I12ILLLLLLLLLL100LLL100GL150gLL101GLL5000KLL10aLLLL0KLLLL5KL00GL15000GL00000G500aM0K10fL50LRML10GLL5000KLL000SLL000KL500aMLL10fLLLLLLLLLL1";
	
	startRow = chars.indexOf(query.charAt(0));
	startCol = chars.indexOf(query.charAt(1));
	endRow = chars.indexOf(query.charAt(2));
	endCol = chars.indexOf(query.charAt(3));
	
	var temp = new Array(Math.ceil(CELLS_ROWS * CELLS_COLS / 3) * 3);
	for (var i = 0; i < Math.ceil(CELLS_ROWS * CELLS_COLS / 3); i++)
	{
		var n = chars.indexOf(query.charAt(i + 4));
		temp[i * 3] = n & 3;
		temp[i * 3 + 1] = (n & 12) >> 2;
		temp[i * 3 + 2] = (n & 48) >> 4;
	}
	for (var i = 0; i < CELLS_ROWS; i++)
	{
		for (var j = 0; j < CELLS_COLS; j++)
		{
			cells[i][j] = temp[i * CELLS_ROWS + j];
		}
	}
	cells[endRow][endCol] = EXIT;
	
	keyLeft = false;
	keyRight = false;
	keySpace = false;
	
	imageCount = 0;
	
	var time = new Date().getTime();
	
	imgPlayl = new Array(5);
	imgPlayr = new Array(5);
	for (var i = 0; i < 5; i++)
	{
		imgPlayl[i] = new Image();
		imgPlayl[i].onload = onImageLoad;
		imgPlayl[i].src = "playl" + (i + 1) + ".gif?" + time;
		imgPlayr[i] = new Image();
		imgPlayr[i].onload = onImageLoad;
		imgPlayr[i].src = "playr" + (i + 1) + ".gif?" + time;
	}
	
	imgWall = new Image();
	imgWall.onload = onImageLoad;
	imgWall.src = "wall.gif?" + time;
	imgToge = new Image();
	imgToge.onload = onImageLoad;
	imgToge.src = "toge.gif?" + time;
	imgBane = new Image();
	imgBane.onload = onImageLoad;
	imgBane.src = "bane.gif?" + time;
	imgExit = new Image();
	imgExit.onload = onImageLoad;
	imgExit.src = "exit.gif?" + time;
	imgBack = new Image();
	imgBack.onload = onImageLoad;
	imgBack.src = "back.gif?" + time;
	
	addEventListener("keydown", onKeyDown, true);
	addEventListener("keyup", onKeyUp, true);
}

function onImageLoad()
{
	imageCount++;
	if (imageCount == 15)
	{
		initGame();
		stepGame();
		paint();
		setInterval(step, 30);
	}
}

function onKeyDown(e)
{
	if (e.keyCode == 37) keyLeft = true;
	if (e.keyCode == 39) keyRight = true;
	if (e.keyCode == 32) keySpace = true;
}

function onKeyUp(e)
{
	if (e.keyCode == 37) keyLeft = false;
	if (e.keyCode == 39) keyRight = false;
	if (e.keyCode == 32) keySpace = false;
}

function initGame()
{
	playX = startCol * 32 + 8;
	playY = startRow * 32;
	playPrevX = playX;
	playPrevY = playY;
	playVX = 0;
	playVY = 0;
	playLeft = false;
	playAnime = 0;
	playOnWall = false;
	playJumpStat = CAN_JUMP;
	playJumpCnt = 0;
	viewX = playX - SCR_WIDTH / 2 + PLAY_WIDTH / 2;
	viewY = playY - SCR_HEIGHT / 2 + PLAY_HEIGHT / 2 - 16;
	viewFix = 0;
	gameStat = 0;
	gameOverCnt = 0;
}

function paint()
{
	var drawX = Math.round(viewX);
	var drawY = Math.round(viewY);
	var backX = Math.round(viewX / 2) % 32;
	var backY = Math.round(viewY / 2) % 32;
	var limRows = Math.floor((drawY + SCR_HEIGHT) / 32) + 1;
	var limCols = Math.floor((drawX + SCR_WIDTH) / 32) + 1;
	
	for (var i = 0; i < Math.floor(SCR_HEIGHT / 32) + 1; i++)
	{
		for (var j = 0; j < Math.floor(SCR_WIDTH / 32) + 1; j++)
		{
			drawContext.drawImage(imgBack, j * 32 - backX, i * 32 - backY);
		}
	}
	
	for (var i = Math.floor(drawY / 32); (i < limRows) && (i < CELLS_ROWS); i++)
	{
		for (var j = Math.floor(drawX / 32); (j < limCols) && (j < CELLS_COLS); j++)
		{
			if (cells[i][j] == WALL)
			{
				drawContext.drawImage(imgWall, j * 32 - drawX, i * 32 - drawY);
			}
			else if (cells[i][j] == TOGE)
			{
				drawContext.drawImage(imgToge, j * 32 - drawX, i * 32 - drawY + 16);
			}
			else if (cells[i][j] == BANE)
			{
				drawContext.drawImage(imgBane, j * 32 - drawX, i * 32 - drawY + 16);
			}
			else if (cells[i][j] == EXIT)
			{
				drawContext.drawImage(imgExit, j * 32 - drawX + 4, i * 32 - drawY);
			}
		}
	}
	
	if (playLeft)
	{
		drawContext.drawImage(imgPlayl[playAnime], Math.round(playX - viewX), Math.round(playY - viewY));
	}
	else
	{
		drawContext.drawImage(imgPlayr[playAnime], Math.round(playX - viewX), Math.round(playY - viewY));
	}
	
	if (gameStat == GAME_OVER)
	{
		drawContext.fillStyle = "rgb(0,0,0)";
		drawContext.fillText("ＭＩＳＳ", 17, 33);
		drawContext.fillText("ＭＩＳＳ", 18, 33);
		drawContext.fillStyle = "rgb(255, 0, 0)";
		drawContext.fillText("ＭＩＳＳ", 16, 32);
		drawContext.fillText("ＭＩＳＳ", 17, 32);
	}
	else if (gameStat == GAME_CLEAR)
	{
		drawContext.fillStyle = "rgb(0,0,0)";
		drawContext.fillText("ＯＫ", 17, 33);
		drawContext.fillText("ＯＫ", 18, 33);
		drawContext.fillStyle = "rgb(0, 0, 255)";
		drawContext.fillText("ＯＫ", 16, 32);
		drawContext.fillText("ＯＫ", 17, 32);
	}
}

function stepGame(goLeft, goRight, jump)
{
	if ((gameStat == GAME_OVER) || (gameStat == GAME_CLEAR))
	{
		if (gameOverCnt < 90)
		{
			gameOverCnt++;
		}
		else
		{
			initGame();
		}
	}
	
	if (!goLeft && !goRight)
	{
		playAnime = 0;
	}
	if (goLeft && !goRight && (gameStat == 0))
	{
		playVX -= PLAY_ACCEL * 2;
		playLeft = true;
		playAnime++;
		playAnime %= 4;
	}
	else if (goRight && !goLeft && (gameStat == 0))
	{
		playVX += PLAY_ACCEL * 2;
		playLeft = false;
		playAnime++;
		playAnime %= 4;
	}
	
	if (!playOnWall)
	{
		playAnime = 0;
	}
	
	if (gameStat == GAME_CLEAR)
	{
		playAnime = 4;
	}
	
	if (!jump && (playJumpStat == CANT_JUMP) && (playOnWall || (playVY > 0)))
	{
		playJumpStat = CAN_JUMP;
	}
	if (jump && playOnWall && (playJumpStat == CAN_JUMP))
	{
		playJumpStat = INIT_JUMP;
		playJumpCnt = 0;
	}
	if (jump && (playJumpStat == INIT_JUMP) && (gameStat == 0))
	{
		if ((playJumpCnt >= PLAY_JUMPLIM) || !playOnWall)
		{
			playVY = -Math.sqrt(PLAY_POWER * playJumpCnt);
			playJumpStat = CANT_JUMP;
			playJumpCnt = 0;
		}
		else if (playJumpCnt < PLAY_JUMPLIM)
		{
			playJumpCnt++;
		}
	}
	if (!jump && (playJumpStat == INIT_JUMP) && (gameStat == 0))
	{
		playVY = -Math.sqrt(PLAY_POWER * playJumpCnt);
		playJumpStat = CANT_JUMP;
		playJumpCnt = 0;
	}
	
	playVY += PLAY_GRAV;
	if (Math.abs(playVX) < PLAY_ACCEL)
	{
		playVX = 0;
	}
	else
	{
		if (playVX < 0)
		{
			playVX += PLAY_ACCEL;
		}
		else if (playVX > 0)
		{
			playVX -= PLAY_ACCEL;
		}
	}
	if (playVX < -PLAY_MAXVX)
	{
		playVX = -PLAY_MAXVX;
	}
	else if (playVX > PLAY_MAXVX)
	{
		playVX = PLAY_MAXVX;
	}
	if (playVY > PLAY_MAXVY)
	{
		playVY = PLAY_MAXVY;
	}

	playPrevX = playX;
	playPrevY = playY;
	playX += playVX;
	playY += playVY;

	if (playX < 0)
	{
		playX = 0;
		playVX = 0;
	}
	else if (playX > FIELD_WIDTH - PLAY_WIDTH)
	{
		playX = FIELD_WIDTH - PLAY_WIDTH;
		playVX = 0;
	}
	if (playY < 0)
	{
		playY = 0;
		playVY = 0;
	}
	else if (playY > FIELD_HEIGHT)
	{
		playY = FIELD_HEIGHT;
		playVX = 0;
		playVY = 0;
		gameStat = GAME_OVER;
	}
	
	playOnWall = false;
	var ul = cells[Math.floor(playY / 32)][Math.floor(playX / 32)] == WALL;
	var ur = cells[Math.floor(playY / 32)][Math.ceil((playX + PLAY_WIDTH) / 32) - 1] == WALL;
	var ll = cells[Math.ceil((playY + PLAY_HEIGHT) / 32) - 1][Math.floor(playX / 32)] == WALL;
	var lr = cells[Math.ceil((playY + PLAY_HEIGHT) / 32) - 1][Math.ceil((playX + PLAY_WIDTH) / 32) - 1] == WALL;
	
	if (ur && lr)
	{
		playX = Math.floor((playX + PLAY_WIDTH) / 32) * 32 - PLAY_WIDTH;
		playVX = 0;
	}
	
	if (ur && !ul && !lr)
	{
		if ((Math.ceil((playPrevX + PLAY_WIDTH) / 32) == Math.ceil((playX + PLAY_WIDTH) / 32)) && (Math.floor(playPrevY / 32) == Math.floor(playY / 32) + 1))
		{
			playY = (Math.floor(playY / 32) + 1) * 32;
			playVY = 0;
		}
		else
		{
			playX = Math.floor((playX + PLAY_WIDTH) / 32) * 32 - PLAY_WIDTH;
			playVX = 0;
		}
	}
	
	if (ul && ur)
	{
		playY = (Math.floor(playY / 32) + 1) * 32;
		playVY = 0;
	}
	
	if (ul && !ur && !ll)
	{
		if ((Math.floor(playPrevX / 32) == Math.floor(playX / 32)) && (Math.floor(playPrevY / 32) == Math.floor(playY / 32) + 1))
		{
			playY = (Math.floor(playY / 32) + 1) * 32;
			playVY = 0;
		}
		else
		{
			playX = (Math.floor(playX / 32) + 1) * 32;
			playVX = 0;
		}
	}
	
	if (ul && ll)
	{
		playX = (Math.floor(playX / 32) + 1) * 32;
		playVX = 0;
	}
	
	if (ll && !ul && !lr)
	{
		if ((Math.floor(playPrevX / 32) == Math.floor(playX / 32)) && (Math.ceil((playPrevY + PLAY_HEIGHT) / 32) == Math.ceil((playY + PLAY_HEIGHT) / 32) - 1))
		{
			playY = Math.floor((playY + PLAY_HEIGHT) / 32) * 32 - PLAY_HEIGHT;
			playVY = 0;
			playOnWall = true;
		}
		else if ((Math.floor(playPrevX / 32) == Math.floor(playX / 32) + 1) && (Math.ceil((playPrevY + PLAY_HEIGHT) / 32) == Math.ceil((playY + PLAY_HEIGHT) / 32) - 1))
		{
			playY = Math.floor((playY + PLAY_HEIGHT) / 32) * 32 - PLAY_HEIGHT;
			playVY = 0;
			playOnWall = true;
		}
		else
		{
			playX = (Math.floor(playX / 32) + 1) * 32;
			playVX = 0;
		}
	}
	
	if (ll && lr)
	{
		playY = Math.floor((playY + PLAY_HEIGHT) / 32) * 32 - PLAY_HEIGHT;
		playVY = 0;
		playOnWall = true;
	}
	
	if (lr && !ur && !ll)
	{
		if ((Math.ceil((playPrevX + PLAY_WIDTH) / 32) == Math.ceil((playX + PLAY_WIDTH) / 32)) && (Math.ceil((playPrevY + PLAY_HEIGHT) / 32) == Math.ceil((playY + PLAY_HEIGHT) / 32) - 1))
		{
			playY = Math.floor((playY + PLAY_HEIGHT) / 32) * 32 - PLAY_HEIGHT;
			playVY = 0;
			playOnWall = true;
		}
		else if ((Math.ceil((playPrevX + PLAY_WIDTH) / 32) == Math.ceil((playX + PLAY_WIDTH) / 32) - 1) && (Math.ceil((playPrevY + PLAY_HEIGHT) / 32) == Math.ceil((playY + PLAY_HEIGHT) / 32) - 1))
		{
			playY = Math.floor((playY + PLAY_HEIGHT) / 32) * 32 - PLAY_HEIGHT;
			playVY = 0;
			playOnWall = true;
		}
		else
		{
			playX = Math.floor((playX + PLAY_WIDTH) / 32) * 32 - PLAY_WIDTH;
			playVX = 0;
		}
	}
	
	if (cells[Math.ceil((playY + PLAY_HEIGHT) / 32) - 1][Math.floor(playX / 32)] == TOGE)
	{
		if ((playY > Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT) && (playPrevY <= Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT))
		{
			playY = Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT;
			playVX = 0;
			playVY = 0;
			gameStat = GAME_OVER;
		}
	}
	
	if (cells[Math.ceil((playY + PLAY_HEIGHT) / 32) - 1][Math.ceil((playX + PLAY_WIDTH) / 32) - 1] == TOGE)
	{
		if ((playY > Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT) && (playPrevY <= Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT))
		{
			playY = Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT;
			playVX = 0;
			playVY = 0;
			gameStat = GAME_OVER;
		}
	}
	
	if (cells[Math.ceil((playY + PLAY_HEIGHT) / 32) - 1][Math.floor(playX / 32)] == BANE)
	{
		if ((playY > Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT) && (playPrevY <= Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT))
		{
			playY = Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT;
			playVY = -BANE_POWER;
		}
	}
	if (cells[Math.ceil((playY + PLAY_HEIGHT) / 32) - 1][Math.ceil((playX + PLAY_WIDTH) / 32) - 1] == BANE)
	{
		if ((playY > Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT) && (playPrevY <= Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT))
		{
			playY = Math.ceil((playY + PLAY_HEIGHT) / 32) * 32 - 16 - PLAY_HEIGHT;
			playVY = -BANE_POWER;
		}
	}
	
	if ((Math.abs(endCol * 32 + 16 - playX - PLAY_WIDTH / 2) <= 4) && (playY == endRow * 32) && playOnWall)
	{
		playX = endCol * 32 + 8;
		playVX = 0;
		playVY = 0;
		gameStat = GAME_CLEAR;
	}
	
	if (playLeft)
	{
		viewFix--;
	}
	else
	{
		viewFix++;
	}
	if (viewFix < -48)
	{
		viewFix = -48;
	}
	if (viewFix > 48)
	{
		viewFix = 48;
	}
	viewX = playX - SCR_WIDTH / 2 + PLAY_WIDTH / 2 + viewFix;
	if (gameStat == 0)
	{
		viewY = playY - SCR_HEIGHT / 2 + PLAY_HEIGHT / 2 - 16;
	}
	else
	{
		viewY--;
	}
	if (viewX < 0)
	{
		viewX = 0;
	}
	if (viewX > FIELD_WIDTH - SCR_WIDTH)
	{
		viewX = FIELD_WIDTH - SCR_WIDTH;
	}
	if (viewY < 0)
	{
		viewY = 0;
	}
	if (viewY > FIELD_HEIGHT - SCR_HEIGHT)
	{
		viewY = FIELD_HEIGHT - SCR_HEIGHT;
	}
}

function step()
{
	stepGame(keyLeft, keyRight, keySpace);
	paint();
}
