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
const fs = require('fs');


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

router.get('/api', async (ctx, next) => {
    // ctx.router available
    const markdown = require('markdown-it')({
        html: true,
        linkify: true,
        typographer: true
      });
    const md = fs.readFileSync('./jscan-api.md', 'utf8');
    const content = markdown.render(md);
    const html = `<!DOCTYPE html>
    <html lang="zh-cn">
    <head>
    <title>Jscan API</title>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.6.1/github-markdown.min.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
    <article class="markdown-body" >
    ${content}
    </article>
    </body>
    </html>`;
    ctx.body = html;
    // ctx.body = { status: 'ok' , message: 'Welcome to Jscan API'};
})

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
    var sql = 'SELECT id FROM `j_tx` WHERE 1 ';
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
    } else if (ctx.query.size) {
        limit = Number(ctx.query.size);
    }
    if (limit > 100) {
        limit = 10;
    }
    if (ctx.query.offset) {
        offset = Number(ctx.query.offset)
    } else if (ctx.query.page) {
        offset = Number(ctx.query.page) * limit;
    }
    
    sql += `ORDER BY block_id desc `;
    sql += `LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const promisePool = connection.promise();
    const [idResults, idFields] = await promisePool.query(sql, params);
    if (!idResults || idResults.length == 0) {
        ctx.body = { status: 'error', message: 'No data'};
        return;
    }
    var ids = [];
    for (var i = 0; i < idResults.length; i++) {
        ids.push(idResults[i].id);
    }
    sql = 'SELECT * FROM `j_tx` WHERE id IN (?)';
    params = [ids];
    const [results, fields] = await promisePool.query(sql, params);
    if (results) {
        for (var i = 0; i < results.length; i++) {
            var tx = results[i];
            delete tx['id'];
            if (tx.input != '0x') {
                var decodedData = abiDecoder.decodeMethod(tx.input);
                if (decodedData) {
                    tx.input_decode = decodedData;

                    for (var j = 0; j < tx.input_decode.params.length; j++) {
                        var param = tx.input_decode.params[j];
                        if (param.name == 'data') {
                            var decodedData2 = abiDecoder.decodeMethod(param.value);
                            if (decodedData2) {
                                tx.sub_input_decode = decodedData2;
                            }
                        }
                        
                    }
                }
            }
        }
    }

    ctx.body = { status: 'ok' , txs: results};

})

router.get('/', async (ctx, next) => {
    ctx.body = 'Hello World';
})

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);