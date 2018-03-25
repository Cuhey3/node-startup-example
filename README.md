皆さんこんにちは。しうへいと申します。
Webアプリケーションを作っていて「コントローラそのものを任意のタイミングで切り替えたい」と思ったことはないでしょうか。
今回はそれを実現する方法について、サンプルを交えて書きたいと思います。

言語はNode.jsですが、クロージャおよびそれに類する機能を有する言語であれば、広く適用できる方法だと思います。
# まずは普通にルーティングを記述する
```Controllers.js
module.exports = {
    foo: function(req, res) {
        res.send("foo");
    }
};
```

```server.js
var http = require('http');
var express = require('express');
var router = express();
var server = http.createServer(router);

var controllers = require('./Controllers');

router.get('/foo', controllers.foo);

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("listening at", addr.address + ":" + addr.port);
});
```

上記のコードでは、router.get('/foo', controllers.foo); の部分でURIとリクエストメソッド、コントローラの組み合わせをルーターにマッピングしています。
しかし一般的なWebフレームワークでは、マッピングは設定用のファイルに書くことになっていたり、
また、上記のExpressでもそうですが、コントローラの再代入が制限されていたりします。
ですので今回は<b>この部分には手を加えずに</b>、コントローラの切り替えを実現することにします。

# コントローラの参照を保持するオブジェクトを作成する
以下のような関数を新たに記述して、コントローラの参照を保持するオブジェクトを作成します。
オブジェクトは二つの関数を持っていて、
do関数は、仮のコントローラとでも呼ぶべきもので、request, responseを受け取り、実際のコントローラへバイパスします。
set関数は、他のコントローラへ参照を書き換える関数です。

```ControllerUtil.js
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
```
このコードを、コントローラが記述されているControllers.jsから使用します。
以下のサンプルでは、Controllers.jsが読み込まれてから5秒後に、レスポンスが"default response"から "rewrited response"へと変わります。

```Controllers.js
var controllerUtil = require('./ControllerUtil');
var controllerObject = controllerUtil.createObject();

module.exports = {
    foo: controllerObject.do
};

//5秒後にコントローラを書き換える
setTimeout(function() {
    controllerObject.set(function(req, res) {
        res.send('rewrited response');
    });
}, 5000);
```

# コントローラの書き換えを、色んなタイミングや場所で行う
controllerObjectへの参照さえあれば、コントローラを書き換えることができます。
まずControllers.jsがcontrollerObjectの参照を返せるようにします。

```Controllers.js
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
```

以下に、Promiseを使用する簡単なモジュールpromises.jsを用意しました。
内容としては、郵便番号情報を取得するAPIを呼び、取得後10秒待って結果を返す、というものです。

```promises.js
var rp = require('request-promise');

module.exports = {
    // 郵便番号情報を取得するAPI
    zipCode: rp('http://zipcloud.ibsnet.co.jp/api/search?zipcode=7830060')
        // 取得後10秒待つ
        .then(function(data) {
            return new Promise(
                function(resolve, reject) {
                    setTimeout(function() {
                        resolve(data);
                    }, 10000);
                });
        })
};
```

このPromiseが完了したあとに、コントローラが書き換えられるようにします。
controllerObjectへの参照があればどこに記述しても構いませんが、今回はserver.jsの中に書き換えロジックを記述します。

```server.js
var http = require('http');
var express = require('express');
var router = express();
var server = http.createServer(router);

var controllers = require('./Controllers');

router.get('/foo', controllers.foo);

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("listening at", addr.address + ":" + addr.port);
});

// zipCode取得後にコントローラを書き換える
var promises = require('./promises');
promises.zipCode.then(function(response) {
    controllers.getControllerObject.set(function(req, res) {
      res.send(response);
    });
});
```

アプリケーションを実行して /foo にアクセスすると、起動してすぐの時は "default response"、
起動5秒後には "rewrited response"、
10秒後には郵便番号情報が返ってくるようになるのがわかります。
この他、アクセスカウンターの数に応じてコントローラを差し替えてみる、なども実験としては面白いかもしれません。
（普通は条件文で済ませるところですが。）


# 最後に
アプリケーション起動後にコントローラを書き換えたい、という需要は多からず少なからずあると思います。
フレームワークのレイヤーで対応可能であれば良いのですが、今使用しているフレームワークが対応しているかいまいちあやしい時、
学習・検証に時間を割けない時などは、クロージャを使ったコントローラの書き換えが有効かもしれません。

というわけで、ここまでお読みいただき、ありがとうございました。