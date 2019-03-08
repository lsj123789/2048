import colors from 'colors';

cc.Class({
    extends: cc.Component,

    properties: {
        numberLabel: cc.Label, //numberLabel类型是label

    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    setNumber(number) {
        if (number == 0) {
            this.numberLabel.node.active = false; //nubmerlabel下的根节点的属性设为false
        }
        this.numberLabel.string = number;
        if (number in colors) {
            this.node.color = colors[number]; //根节点的颜色 就是颜色字典里对应的颜色
        }
    }

    // update (dt) {},
});