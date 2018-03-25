module.exports = {
    createObject: function() {
        // コントローラへの参照
        // クロージャによってオブジェクトに保持される
        var controller = function(req, res) {
            res.send('default response');
        };
        // オブジェクトはクロージャによってコントローラへアクセス可能
        return {
            // コントローラへrequest, responseをバイパスするコントローラ
            do: function(req, res) {
                controller(req, res);
            },
            set: function(newController) {
                controller = newController;
            }
        };
    }
};
