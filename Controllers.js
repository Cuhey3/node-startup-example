var controllerUtil = require('./ControllerUtil');
var controllerObject = controllerUtil.createObject();

module.exports = {
    foo: controllerObject.do,
    // コントローラオブジェクトを返す
    getControllerObject: controllerObject

};

//5秒後にコントローラを書き換える
setTimeout(function() {
    controllerObject.set(function(req, res) {
        res.send('rewrited response');
    });
}, 5000);
