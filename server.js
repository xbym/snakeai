const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// 蛇的游戏状态
let gameState = {
    snake: [{x: 20, y: 15}], // 初始位置
    foods: [{x: 10, y: 10}],
    direction: {x: 1, y: 0},
    score: 0,
    directionScores: {
        'up': 0,
        'right': 0,
        'down': 0,
        'left': 0
    },
    directionAttempts: {
        'up': 0,
        'right': 0,
        'down': 0,
        'left': 0
    },
    directionChanges: 0,
    lastChangeTime: Date.now(),
    startTime: Date.now(),
    lastFoodTime: Date.now(),  // 上次添加食物的时间
    gridSize: 20,
    boardWidth: 40,  // 800/20
    boardHeight: 30  // 600/20
};

// 游戏逻辑
function updateGame() {
    // 移动蛇
    const newHead = {
        x: gameState.snake[0].x + gameState.direction.x,
        y: gameState.snake[0].y + gameState.direction.y
    };

    // 穿墙
    newHead.x = (newHead.x + gameState.boardWidth) % gameState.boardWidth;
    newHead.y = (newHead.y + gameState.boardHeight) % gameState.boardHeight;

    // 检查是否吃到食物
    const foodIndex = gameState.foods.findIndex(food => 
        food.x === newHead.x && food.y === newHead.y
    );

    if (foodIndex !== -1) {
        // 吃到食物
        gameState.foods.splice(foodIndex, 1);
        gameState.score++;
        // 不删除尾部（蛇变长）
        
        // 生成新食物
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * gameState.boardWidth),
                y: Math.floor(Math.random() * gameState.boardHeight)
            };
        } while (
            gameState.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
            gameState.foods.some(food => food.x === newFood.x && food.y === newFood.y)
        );
        gameState.foods.push(newFood);

        // 更新方向得分
        const currentDirName = getDirName(gameState.direction);
        gameState.directionScores[currentDirName] = (gameState.directionScores[currentDirName] || 0) + 1;
    } else {
        // 没吃到食物，删除尾部
        gameState.snake.pop();
    }

    // 添加新头部
    gameState.snake.unshift(newHead);

    // 每5秒改变一次方向
    const now = Date.now();
    if (now - gameState.lastChangeTime >= 5000) {
        changeDirection();
        gameState.lastChangeTime = now;
    }

    // 如果蛇长度小于10，每10秒添加一个食物
    if (gameState.snake.length < 10 && now - gameState.lastFoodTime >= 10000) {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * gameState.boardWidth),
                y: Math.floor(Math.random() * gameState.boardHeight)
            };
        } while (
            gameState.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
            gameState.foods.some(food => food.x === newFood.x && food.y === newFood.y)
        );
        gameState.foods.push(newFood);
        gameState.lastFoodTime = now;
    }
}

// 获取方向名称
function getDirName(dir) {
    if (dir.x === 1) return 'right';
    if (dir.x === -1) return 'left';
    if (dir.y === 1) return 'down';
    if (dir.y === -1) return 'up';
}

// 改变方向
function changeDirection() {
    const possibleDirs = [
        {x: 1, y: 0},   // 右
        {x: -1, y: 0},  // 左
        {x: 0, y: 1},   // 下
        {x: 0, y: -1}   // 上
    ];

    // 随机选择一个新方向（排除当前方向）
    const currentDir = gameState.direction;
    const newDirs = possibleDirs.filter(dir => 
        !(dir.x === currentDir.x && dir.y === currentDir.y)
    );

    const randomDir = newDirs[Math.floor(Math.random() * newDirs.length)];
    const dirName = getDirName(randomDir);
    gameState.directionAttempts[dirName]++;
    gameState.direction = randomDir;
    gameState.directionChanges++;
}

// 每150ms更新一次游戏状态
setInterval(updateGame, 150);

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 服务静态文件

// 获取游戏状态
app.get('/api/state', (req, res) => {
    res.json(gameState);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 