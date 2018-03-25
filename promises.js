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
