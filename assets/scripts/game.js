let ROWS = 4; //行数
let NUMBERS = [2, 4]; //随机生成的格子里面的数字
let MIN_LENGTH = 50; //最小拖动的长度
const MOVE_DURATION = 0.1; //移动格子的时长

cc.Class({
    extends: cc.Component,

    properties: {
        scoreLabel: cc.Label,
        score: 0,
        blockPrefab: cc.Prefab,
        gap: 20, //每个块之间的间隔
        bg: cc.Node //用于维护 的 根节点 刚好是bg
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        this.drawBgBlocks(); //画出每一个小格子
        this.init(); //初始化
        this.addEventHandler(); //处理事件监听
    },

    drawBgBlocks() {
        this.blockSize = (cc.winSize.width - this.gap * (ROWS + 1)) / ROWS; //每个格子大小
        let x = this.gap + this.blockSize / 2;
        let y = this.blockSize;
        this.positions = [];
        for (let i = 0; i < ROWS; i++) {
            this.positions.push([0, 0, 0, 0]);
            for (let j = 0; j < ROWS; j++) {
                let block = cc.instantiate(this.blockPrefab); //Instantiate函数是unity3d中进行实例化的函数，也就是对一个对象进行复制操作的函数
                block.width = this.blockSize;
                block.height = this.blockSize;
                this.bg.addChild(block);
                block.setPosition(cc.p(x, y));
                this.positions[i][j] = cc.p(x, y); //存每一行每一列格子的位置
                x += this.gap + this.blockSize;
                block.getComponent('block').setNumber(0);
            }
            y += this.gap + this.blockSize;
            x = this.gap + this.blockSize / 2;
        }
    },

    init() {
        this.updateScore(0);
        if (this.blocks) {
            for (let i = 0; i < this.blocks.length; i++) {
                for (let j = 0; j < this.blocks[i].length; j++) {
                    if (this.blocks[i][j] != null) {
                        this.blocks[i][j].destroy();
                    }
                }
            }
        }
        this.data = []; //data存的是每个block里面的数字、
        this.blocks = [];
        for (let i = 0; i < ROWS; i++) {
            this.blocks.push([null, null, null, null])
            this.data.push([0, 0, 0, 0])
        }
        this.addBlocks();
        this.addBlocks();
        this.addBlocks();
    },

    updateScore(number) {
        this.score = number;
        this.scoreLabel.string = '分数：' + number;
    },

    //找出空闲块
    //返回 空闲块数位置表示
    getEmptyLocations() {
        let locations = []; //存放每个块的位置编号
        for (let i = 0; i < this.blocks.length; ++i) {
            for (let j = 0; j < this.blocks[i].length; ++j) {
                if (this.blocks[i][j] == null) {
                    locations.push({
                        x: i,
                        y: j
                    })
                }
            }
        }
        return locations;
    },

    addBlocks() {
        let locations = this.getEmptyLocations();
        if (locations.length == 0) return false;
        let location = locations[Math.floor(cc.random0To1() * locations.length)];
        let x = location.x;
        let y = location.y;
        let position = this.positions[x][y];
        let block = cc.instantiate(this.blockPrefab);
        block.width = this.blockSize;
        block.height = this.blockSize;
        this.bg.addChild(block);
        block.setPosition(position);
        let number = NUMBERS[Math.floor(cc.random0To1() * NUMBERS.length)];
        block.getComponent('block').setNumber(number);
        this.blocks[x][y] = block;
        this.data[x][y] = number;
        return true;
    },

    addEventHandler() {
        this.bg.on('touchstart', (event) => { //监听鼠标点下去时的开始事件
            this.startPoint = event.getLocation(); //拿到鼠标点下去时的块的位置信息
        })
        this.bg.on('touchend', (event) => { //监听鼠标放开时的结束事件
            this.touchEnd(event);
        })
        this.bg.on('touchcancel', (event) => {
            this.touchEnd(event);
        })
    },
    touchEnd(event) {
        this.endPoint = event.getLocation(); //获取鼠标放开时的块的位置信息
        let vec = cc.pSub(this.endPoint, this.startPoint); //得到结束与开始位置的向量
        if (cc.pLength(vec) > MIN_LENGTH) { //cc.pLength()计算向量长度  向量长度大于min_length时 才去响应
            if (Math.abs(vec.x) > Math.abs(vec.y)) { //Math.abs取绝对值 vec.x 向量vec在x轴方向上的位移
                //水平方向
                if (vec.x > 0) {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
            } else {
                //竖直方向
                if (vec.y > 0) {
                    this.moveUp();
                } else {
                    this.moveDown();
                }
            }
        }
    },


    checkFail() {
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < ROWS; j++) {
                let n = this.data[i][j];
                if (n == 0) return false;
                if (i > 0 && this.data[i - 1][j] == n) return false;
                if (i < 3 && this.data[i + 1][j] == n) return false;
                if (j > 0 && this.data[i][j - 1] == n) return false;
                if (j < 3 && this.data[i][j + 1] == n) return false;
            }
        }
        return true;
    },

    gameOver() {
        cc.log('game over!')
    },



    afterMove(hasMoved) {
        if (hasMoved) {
            this.updateScore(this.score + 1)
            this.addBlocks()
        }
        if (this.checkFail()) {
            this.gameOver()
        }
    },
    doMove(block, position, callback) {
        let action = cc.moveTo(MOVE_DURATION, position); //移动时的函数
        let finish = cc.callFunc(() => { //移动完成
            callback && callback();
        })
        block.runAction(cc.sequence(action, finish)) //sequence（）顺序执行里面的函数
    },

    moveLeft() {
        //递归方法  
        let hasMoved = false;
        let move = (x, y, callback) => {
            if (y == 0 || this.data[x][y] == 0) {
                callback && callback();
                return;
            } else if (this.data[x][y - 1] == 0) { //移动
                let block = this.blocks[x][y]; //取出当前块
                let position = this.positions[x][y - 1]; //取出当前块的左边块的位置
                this.blocks[x][y - 1] = block; //把blcok赋给左边的块
                this.data[x][y - 1] = this.data[x][y]; //当前块的值赋给左边块
                this.data[x][y] = 0; //当前块值清空
                this.blocks[x][y] = null;
                this.doMove(block, position, () => { //block移动到position
                    move(x, y - 1, callback)
                })
                hasMoved = true
            } else if (this.data[x][y - 1] == this.data[x][y]) { //合并
                let block = this.blocks[x][y];
                let position = this.positions[x][y - 1];
                this.data[x][y - 1] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x][y - 1].getComponent('block').setNumber(this.data[x][y - 1]);
                this.doMove(block, position, () => {
                    block.destroy();
                    callback && callback()
                })
                hasMoved = true
            } else {
                callback && callback();
                return
            }
        }

        let toMove = []; //要挪动的块
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < ROWS; j++) { //循环遍历每个块
                if (this.data[i][j] != 0) { //找到不为空的块
                    toMove.push({
                        x: i,
                        y: j
                    }) //把这个块的坐标加入数组中
                }
            }
        }
        let counter = 0;
        for (let i = 0; i < toMove.length; i++) {
            move(toMove[i].x, toMove[i].y, () => {
                counter++;
                if (counter == toMove.length) {
                    this.afterMove(hasMoved);
                }
            })
        }

    },
    moveRight() {
        let hasMoved = false;
        let move = (x, y, callback) => {
            if (y == 3 || this.data[x][y] == 0) {
                callback && callback();
                return;
            } else if (this.data[x][y + 1] == 0) { //移动
                let block = this.blocks[x][y]; //取出当前块
                let position = this.positions[x][y + 1]; //取出当前块的左边块的位置
                this.blocks[x][y + 1] = block; //把blcok赋给左边的块
                this.data[x][y + 1] = this.data[x][y]; //当前块的值赋给左边块
                this.data[x][y] = 0; //当前块值清空
                this.blocks[x][y] = null;
                this.doMove(block, position, () => { //block移动到position
                    move(x, y + 1, callback)
                })
                hasMoved = true
            } else if (this.data[x][y + 1] == this.data[x][y]) { //合并
                let block = this.blocks[x][y];
                let position = this.positions[x][y + 1];
                this.data[x][y + 1] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x][y + 1].getComponent('block').setNumber(this.data[x][y + 1]);
                this.doMove(block, position, () => {
                    block.destroy();
                    callback && callback()
                })
                hasMoved = true
            } else {
                callback && callback();
                return
            }
        }

        let toMove = []; //要挪动的块
        for (let i = 0; i < ROWS; i++) {
            for (let j = ROWS - 1; j >= 0; j--) { //循环遍历每个块
                if (this.data[i][j] != 0) { //找到不为空的块
                    toMove.push({
                        x: i,
                        y: j
                    }) //把这个块的坐标加入数组中
                }
            }
        }
        let counter = 0;
        for (let i = 0; i < toMove.length; i++) {
            move(toMove[i].x, toMove[i].y, () => {
                counter++;
                if (counter == toMove.length) {
                    this.afterMove(hasMoved);
                }
            })
        }

    },
    moveUp() {
        let hasMoved = false;
        let move = (x, y, callback) => {
            if (x == 3 || this.data[x][y] == 0) {
                callback && callback();
                return;
            } else if (this.data[x + 1][y] == 0) { //移动
                let block = this.blocks[x][y]; //取出当前块
                let position = this.positions[x + 1][y];
                this.blocks[x + 1][y] = block;
                this.data[x + 1][y] = this.data[x][y];
                this.data[x][y] = 0; //当前块值清空
                this.blocks[x][y] = null;
                this.doMove(block, position, () => { //block移动到position
                    move(x + 1, y, callback)
                })
                hasMoved = true
            } else if (this.data[x + 1][y] == this.data[x][y]) { //合并
                let block = this.blocks[x][y];
                let position = this.positions[x + 1][y];
                this.data[x + 1][y] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x + 1][y].getComponent('block').setNumber(this.data[x + 1][y]);
                this.doMove(block, position, () => {
                    block.destroy();
                    callback && callback()
                })
                hasMoved = true
            } else {
                callback && callback();
                return
            }
        }

        let toMove = []; //要挪动的块
        for (let i = 3; i >= 0; --i) {
            for (let j = 0; j < ROWS; ++j) { //循环遍历每个块
                if (this.data[i][j] != 0) { //找到不为空的块
                    toMove.push({
                        x: i,
                        y: j
                    }) //把这个块的坐标加入数组中
                }
            }
        }
        let counter = 0;
        for (let i = 0; i < toMove.length; i++) {
            move(toMove[i].x, toMove[i].y, () => {
                counter++;
                if (counter == toMove.length) {
                    this.afterMove(hasMoved);
                }
            })
        }
    },
    moveDown() {
        let hasMoved = false;
        let move = (x, y, callback) => {
            if (x == 0 || this.data[x][y] == 0) {
                callback && callback();
                return;
            } else if (this.data[x - 1][y] == 0) { //移动
                let block = this.blocks[x][y]; //取出当前块
                let position = this.positions[x - 1][y];
                this.blocks[x - 1][y] = block;
                this.data[x - 1][y] = this.data[x][y];
                this.data[x][y] = 0; //当前块值清空
                this.blocks[x][y] = null;
                this.doMove(block, position, () => { //block移动到position
                    move(x - 1, y, callback)
                })
                hasMoved = true
            } else if (this.data[x - 1][y] == this.data[x][y]) { //合并
                let block = this.blocks[x][y];
                let position = this.positions[x - 1][y];
                this.data[x - 1][y] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x - 1][y].getComponent('block').setNumber(this.data[x - 1][y]);
                this.doMove(block, position, () => {
                    block.destroy();
                    callback && callback()
                })
                hasMoved = true
            } else {
                callback && callback();
                return
            }
        }

        let toMove = []; //要挪动的块
        for (let i = 0; i < ROWS; ++i) {
            for (let j = 0; j < ROWS; ++j) { //循环遍历每个块
                if (this.data[i][j] != 0) { //找到不为空的块
                    toMove.push({
                        x: i,
                        y: j
                    }) //把这个块的坐标加入数组中
                }
            }
        }
        let counter = 0;
        for (let i = 0; i < toMove.length; i++) {
            move(toMove[i].x, toMove[i].y, () => {
                counter++;
                if (counter == toMove.length) {
                    this.afterMove(hasMoved);
                }
            })
        }
    }


    // update (dt) {},
});