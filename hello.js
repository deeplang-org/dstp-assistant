const fs = require('fs');
console.log("Hello deeplang");
fs.readFile("./fib.dp", function(err, data) {//readFile F一定要大写
    if(err){
        console.log(err + "打开文件夹错误");
        return;
    }
    //读取的是信息流，是Buffer是缓冲的二进制，用toString()转为字符串
    console.log(data.toString());
});

