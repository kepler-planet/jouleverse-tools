require('dotenv').config();
require('json-bigint-patch'); // 解决 JSON 解析大整数的问题
const json = require('koa-json')
const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const mysql = require('mysql2');
const { Web3 } = require('web3');
const web3 = new Web3(process.env.JSCAN_RPC_URL);
const lib = require('./lib');

// 创建连接池，设置连接池的参数
const connection = mysql.createPool({
    host: process.env.JSCAN_MYSQL_HOST,
    user: process.env.JSCAN_MYSQL_USER,
    database: process.env.JSCAN_MYSQL_DATABASE,
    password: process.env.JSCAN_MYSQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // 最大空闲连接数，默认等于 `connectionLimit`
    idleTimeout: 160000, // 空闲连接超时，以毫秒为单位，默认值为 60000 ms
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

app.use(json({ pretty: false, param: 'pretty' }))

// 设置跨域 
app.use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*")
     ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE")
     await next()
});

const abiJns = lib.abiJns;
const abiMultisig = lib.abiMultisig;
const abiAddress = lib.abiAddress;
const boredape_ABI = lib.boredape_ABI;
const abiDecoder = require('abi-decoder'); // NodeJS
abiDecoder.addABI(abiJns);
abiDecoder.addABI(abiMultisig);
abiDecoder.addABI(abiAddress);
abiDecoder.addABI(boredape_ABI);


// 0xfc10a523579230ec64380b8b7739506aa700b40d54c1d4b5f926d736f6def659
router.get('/api/tx/:txid', async (ctx, next) => {
    // ctx.router available
    var txid = ctx.params.txid;
    if (txid.length != 66) {
        ctx.body = { status: 'error', message: 'Invalid txid'};
        return;
    }
    // console.log(txid);
    try {
        var tx = await web3.eth.getTransaction(txid);
        if (tx && tx.input != '0x') {
            console.log
            var decodedData = abiDecoder.decodeMethod(tx.input);
            console.log("decodedData:");
            console.log(decodedData);
            if (decodedData) {
                tx.inputDecode = decodedData;
            }
        }
        ctx.body = { status: 'ok' , tx: tx};
    } catch (error) {
        ctx.body = { status: 'error', message: 'Invalid txid'};
    }

    // ctx.body = { status: 'ok' , txid: ctx.params.txid};
});

router.get('/api/block/:blockid', async (ctx, next) => {
    // ctx.router available
    var blockid = ctx.params.blockid;
    var result = await web3.eth.getBlock(blockid);

    var txs = [];
    for (var i = 0; i < result.transactions.length; i++) {
        var tx = await web3.eth.getTransactionFromBlock(blockid, i);
        if (tx.input != '0x') {
            console.log
            var decodedData = abiDecoder.decodeMethod(tx.input);
            console.log("decodedData:");
            console.log(decodedData);
            if (decodedData) {
                tx.inputDecode = decodedData;
            }
        }
        txs.push(tx);
    }
    ctx.body = { status: 'ok' , block: result, txs: txs};


    // ctx.body = { status: 'ok' , txid: ctx.params.txid};
});


// start_block
// end_block
// offset
// limit
// order
// from_address
// to_address
router.get('/api/txs', async (ctx, next) => {
    // ctx.router available
    var offset = 0;
    var limit = 10;
    var sql = 'SELECT * FROM `j_tx` WHERE 1 ';
    var params = [];
    if (ctx.query.start_block) {
        var start_block = Number(ctx.query.start_block);
        sql += `and block_id >= ? `;
        params.push(start_block);
    }
    if (ctx.query.end_block) {
        var end_block = Number(ctx.query.end_block);
        sql += `AND block_id <= ? `;
        params.push(end_block);
    }
    if (ctx.query.from_address) {
        var from_address = ctx.query.from_address;
        sql += 'AND `from` = ? ';
        params.push(from_address);
    }
    if (ctx.query.to_address) {
        var to_address = ctx.query.to_address;
        sql += 'AND `to` = ? ';
        params.push(to_address);
    }
    if (ctx.query.limit) {
        limit = Number(ctx.query.limit);
    }
    if (ctx.query.offset) {
        offset = Number(ctx.query.offset)
    }
    sql += `ORDER BY block_id desc `;
    sql += `LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const promisePool = connection.promise();
    const [results, fields] = await promisePool.query(sql, params);

    ctx.body = { status: 'ok' , txs: results};

})

router.get('/api/tx/', (ctx, next) => {
    // ctx.router available
    ctx.body = 'Hello World!';
});
  


// // response
// app.use(ctx => {
//     ctx.body = '{"status": "ok}';
// });

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);