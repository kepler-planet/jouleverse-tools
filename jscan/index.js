require('dotenv').config();

const { Web3 } = require('web3');
const mysql = require('mysql2');
const web3 = new Web3(process.env.JSCAN_RPC_URL);


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

// 保存区块信息
async function save_block(block) {
    connection.execute(
        'SELECT * FROM `j_block` WHERE `block_id` = ?',
        [block.number],
        function (err, results, fields) {
            //   console.log(results); // 结果集
            //   console.log(fields); // 额外的元数据（如果有的话）
            if (results.length == 0) {

                const sql = 'INSERT INTO `j_block` (`block_id`, `block_hash`, `timestamp`, `tx_count`, `status`) VALUES (?,?,?,?,?)';
                const values = [block.number.toString(), block.hash, block.timestamp.toString(), block.transactions.length, 1];
                connection.execute(
                    sql,
                    values,
                    function (err, results, fields) {
                        // console.log(results); // 结果集
                        // console.log(fields); // 额外的元数据（如果有的话）
                        if (results && results.length > 0) {
                            // console.log('插入成功');
                        }
                    }
                );
            }
        }
    );
}

// 保存交易信息
async function save_tx(tx, receipt, block) {
    process.stdout.write(`\r保存交易信息${tx.hash} \t\n`);
    
    connection.execute(
        'SELECT * FROM `j_tx` WHERE `tx_hash` = ?', [tx.hash],
        function (err, results, fields) {
            //   console.log(results); // 结果集
            //   console.log(fields); // 额外的元数据（如果有的话）
            if (results && results.length == 0) {
                var receipt_status = 0;
                if (receipt) {
                    receipt_status = receipt.status.toString();
                }
                let tx_to = '';
                if (tx.to) {
                    tx_to = tx.to.toString();
                }

                const sql = 'INSERT INTO `j_tx` (`block_id`, `type`, `tx_index`,  `tx_hash`, `from`, `to`, `input`, `value`, `nonce`, `v`, `r`, `s`, `gas`, `gas_price`, `receipt_status`, `status`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
                const values = [block.number.toString(), tx.type.toString(), tx.transactionIndex.toString(), tx.hash, tx.from.toString(), tx_to, tx.input.toString(), tx.value.toString(), tx.nonce.toString(), tx.v.toString(), tx.r.toString(), tx.s.toString(), tx.gas.toString(), tx.gasPrice.toString(), receipt_status, 1];

                connection.execute(
                    sql,
                    values,
                    function (err, results, fields) {
                        // console.log(results); // 结果集
                        // console.log(fields); // 额外的元数据（如果有的话）
                        if (results && results.length > 0) {
                            // console.log('insert success');
                        }
                    }
                );
            }
        }
    );
}

async function getScanLastBlockId(config_key, config_name) {

    if (!config_name) {
        config_name = config_key;
    }

    const promise = new Promise(resolve => {

        connection.execute('SELECT `number_value` FROM `j_config` WHERE `key` = ?', [config_key], (err, results, fields) => {

            if (results && results.length == 0) {
                connection.execute('INSERT INTO `j_config` (`name`, `key`, `value`, `number_value`) VALUES (?, ?, ?, ?)', [config_name, config_key, '', 0], (err, results, fields) => {
                    if (results && results.length > 0) {
                        // console.log('insert success');
                    }
                })
                return resolve(0);
            } else {
                return resolve(results[0].number_value);
            }
        })


    });

    return await promise;

}

async function saveScanLastBlockId(lastId) {
    var config_key = 'SCAN_LAST_BLOCK_ID';
    connection.execute('UPDATE `j_config` SET `number_value`=? WHERE `key` = ?', [lastId, config_key], (err, results, fields) => {
        if (results && results.length > 0) {
            // console.log('update success');
        }
    })
}

async function scan_block(limit=100000, loop=true) {

    var scanLastBlockId = await getScanLastBlockId('SCAN_LAST_BLOCK_ID');
    var lastBlock = await web3.eth.getBlock();
    var lastBlockIdOnChain = lastBlock.number.toString();
    var endBlockId = Math.min((lastBlockIdOnChain - 100), (scanLastBlockId + limit));

    console.log("起始区块高度:" + scanLastBlockId);
    console.log("最新区块高度:" + lastBlockIdOnChain);
    for (var i = scanLastBlockId; i <= endBlockId; i++) {
       
        process.stdout.write(`\r当前扫码区块高度:${i} \t`);

        var block = await web3.eth.getBlock(i)
        var txCount = block.transactions.length

        if (txCount > 0) {
            for (var j = 0; j < txCount; j++) {
                // console.log(block);
                var save1 = await save_block(block);
                // console.log("tx");
                var tx = await web3.eth.getTransactionFromBlock(i, j);

                try {
                    var receipt = await web3.eth.getTransactionReceipt(tx.hash);
                } catch (e) {
                    // console.log(e);
                }

                if (tx) {
                    var save2 = await save_tx(tx, receipt, block);
                }
            }
        }
        // 更新已处理区块高度
        saveScanLastBlockId(i)
    }

    if (loop == true) {
        console.log("继续扫描下一轮");
        setTimeout(() => {
            scan_block(limit, loop)
        }, 1000);
    }
}

scan_block();





