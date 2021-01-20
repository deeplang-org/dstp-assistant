const fs = require('fs')
var packetTrans = {fd:0, total:0, left:0, packetSize:10}
var fileBuf = Buffer.alloc(1000*1024)
fileBuf.fill(0)
function sendPackets(fd){
    if (packetTrans.left == 0){
        console.log('packet trans done')
        return
    }
    var size = packetTrans.left < packetTrans.packetSize ? packetTrans.left : packetTrans.packetSize;
    var out = Buffer.alloc(size)
    fileBuf.copy(out, 0, packetTrans.total - packetTrans.left)
    console.log('packet:',out.toString().replace('\n',' ').replace('\r', ' '))
    packetTrans.left -= size
    sendPackets(fd)
}

fs.readFile("./fib.dp", function(err, data) {//readFile F一定要大写
    if(err){
        console.log(err);
        return;
    }
    packetTrans.left = data.length;
    packetTrans.total= data.length;
    console.log(data.length)
    data.copy(fileBuf, 0)
    sendPackets()
});



