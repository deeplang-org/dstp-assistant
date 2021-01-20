const SerialPort = require('serialport')
const port = new SerialPort('com4', {
  baudRate: 115200
},function (err) {
    if (err) {
        return console.log('Error: ', err.message)
    }
})


// serial recv buffer
recvBuf = Buffer.alloc(4096)
recvBuf.fill(0x00)
ridx = 0

// send serial data
function send(buf) {
    port.write(buf, function(err) {
        if (err) {
            return console.log('Error on write: ', err.message)
        }
    })
}

function cleanBuf() {
    recvBuf.fill(0x00)
    ridx = 0
}

port.on('data', function (data) {
    data.copy(recvBuf, ridx)
    ridx += data.length;
})

// download .dp or .wasm files
// stepl. check deeplang version
// step2. check mode(DSTP frame mode)
// step3. exit REPL(DSTP ascii mode)
// step4. send file info
// step5. send file packets
// step6. enter REPL
function startDownloadFileWithCheckVersion(){
    send(':version\n')
    setTimeout(function(){
        var str = recvBuf.toString();
        //console.log(str)
        var ver = str.match(/deeplang v+\d*\.\d*/)
        if (ver){
            console.log(ver.toString())
            cleanBuf()
            checkMode()
        } else {
            console.log('check version fail')
            return;
        }
    }, 500)// esp32 reply >200ms, needs optimization
}

function checkMode(){
    send(':mode\n')
    setTimeout(function(){
        var str = recvBuf.toString()
        //console.log(str)
        var out = str.match(/ascii mode/)
        if (out){
            console.log(out.toString())
            cleanBuf()
            exitREPL()
        } else {
            console.log('check DSTP mode fail')
        }
    }, 500)
}

function exitREPL(){
    send(':exit\n')
    setTimeout(function(){
        var str = recvBuf.toString();
        //console.log(str)
        var out = str.match(/exit repl/)
        if (out){
            console.log(out.toString())
            cleanBuf()
            sendFileInfo()
        } else {
            console.log('exit REPL fail')
            return
        }
    }, 1000)
}

const fs = require('fs')
const { info } = require('console')
fileinfo = {name:'', type:'', size:0, offset:0}
function checkSum (buf, len) {
    var out = 0
    for(var i = 0; i < len; i++) {
        out += buf[i]
    }
    return (out&0xff)
}
function sendDstpFrame(cmd, payload){
    var payloadSize = payload.length
    var frameSize = 8 + payloadSize
    var buf = Buffer.alloc(frameSize);
    buf.fill(0x00)
    buf[0] = 0xFE//head
    buf[1] = 0x5A
    buf[2] = cmd//cmd
    buf[3] = payloadSize >> 8 // length
    buf[4] = payloadSize & 0xff
    payload.copy (buf, 5, 0, payloadSize - 1)
    var idx = 5 + payloadSize
    buf[idx] = 0xFA
    buf[idx + 1] = 0xE3
    buf[idx + 2] = checkSum(buf, frameSize)
    console.log('DSTP frame:',buf.toString('hex'))
    send(buf)
}

function sendFileInfo() {
    fs.stat('./fib.dp', function(err, stats) {
        if(err){
            console.log(err)
        }
        //console.log(stats);
        cleanBuf();
        fileinfo.name = './fib.dp'
        fileinfo.size = stats.size
        payloadSize = 2 + fileinfo.name.length
        var payload = Buffer.alloc (payloadSize)
        payload[0] = (stats.size) >> 8
        payload[1] = (stats.size) & 0xFF
        var nameinfo = Buffer.alloc(fileinfo.name.length)
        nameinfo.fill(fileinfo.name)
        nameinfo.copy (payload, 2, 0, fileinfo.name.length - 1)
        sendDstpFrame (0x03, payload)
        setTimeout(function(){
            var str = recvBuf.toString();
            //console.log(str)
            var out = str.match(/fe5a[a-f0-9]+/)
            if (out){
                console.log(out.toString())
                var headAck = out.toString().match(/fe5a02/)
                var tail = out.toString().match(/fae3/)
                if (!(headAck && tail)) {
                    console.log("no dstp head, ack or tail")
                    return
                }
                console.log("dstp ack frame")
                cleanBuf()
                //sendFilePacket()
            } else {
                console.log('Check dstp ack fail')
                return
            }
        }, 1000)
    });
}

function sendFilePacket(){
    
}

startDownloadFileWithCheckVersion()





