const { Web3 } = require('web3');
const moment = require('moment'); // 用于时间戳格式化
//const web3 = new Web3('https://rpc.jnsdao.com:8503');
const web3 = new Web3('http://localhost:8501');

// 定义地址为常量，并自动转换为小写
const YOUR_ADDRESS = '0x2cf5870F43561B48092dA94Ff0A2960384d200F6'.toLowerCase(); // 替换为实际地址，并自动转换为小写

// 动态导入 ora 库的异步函数
async function importOra() {
    const { default: ora } = await import('ora');
    return ora;
}

(async () => {
    try {
        // 动态导入 ora 库
        const ora = await importOra();

        // 设置从哪个区块开始获取交易记录
        const fromBlock = 4018097; // 开始区块
        const toBlock = 4018098; // 结束区块

        // 创建一个 ora 实例
        const spinner = ora('正在处理区块...');
        spinner.start();

        // 获取指定地址的所有交易记录
        const transactions = await getTransactionsByAddress(YOUR_ADDRESS, fromBlock, toBlock, spinner);

        // 停止加载动画
        spinner.stop();

        // 输出交易记录及其时间戳
        console.log(`交易记录: ${JSON.stringify(transactions, (key, value) => {
            if (typeof value === 'bigint') {
                return value.toString(); // 将 bigint 转换为字符串
            }
            return value;
        }, 2)}`);

        if (transactions.length === 0) {
            console.log(`在区块 ${fromBlock} 到 ${toBlock} 之间没有找到涉及地址 ${YOUR_ADDRESS} 的交易。`);
        }
    } catch (error) {
        console.error("最终捕获到的错误：", error);
    }
})();

// 获取指定地址的所有交易记录
async function getTransactionsByAddress(address, fromBlock, toBlock, spinner) {
    try {
        const transactions = [];
        for (let blockNumber = toBlock; blockNumber >= fromBlock; blockNumber--) {
            spinner.text = `正在处理区块 ${blockNumber}...`; // 更新加载动画文本
            const blockTransactions = await getTransactionsInBlock(address, blockNumber);
            transactions.push(...blockTransactions);
        }
        return transactions;
    } catch (error) {
        console.error("获取交易记录时出错：", error);
        throw error;
    }
}

// 获取单个区块中的所有交易记录
async function getTransactionsInBlock(address, blockNumber) {
    try {
        const block = await web3.eth.getBlock(blockNumber, true); // 第二个参数表示是否包含交易信息
        if (block && block.transactions) {
            const transactions = [];
            for (const tx of block.transactions) {
                let txHash = '';
                if (typeof tx === 'object' && tx.hash) {
                    txHash = tx.hash;
                } else if (typeof tx === 'string') {
                    txHash = tx;
                }

                if (typeof txHash !== 'string' || !web3.utils.isHexStrict(txHash)) {
                    console.error(`无效的交易哈希：${txHash}`);
                    continue;
                }
                try {
                    const transaction = await web3.eth.getTransaction(txHash);
                    if (transaction && transaction.from && transaction.to) {
                        if (transaction.from.toLowerCase() === address || transaction.to.toLowerCase() === address) {
                            const timestamp = await getTransactionTimestamp(blockNumber);
                            transactions.push({
                                hash: txHash,
                                timestamp: formatTimestamp(timestamp)
                            });
                        } else {
                            // console.log(`交易 ${txHash} 不涉及地址 ${address}`); // 可以取消注释以查看调试信息
                        }
                    } else {
                        // 记录缺少必要字段的交易
                        console.warn(`交易 ${txHash} 缺少必要的字段 from 或 to。`);
                        console.log(`时间戳：${formatTimestamp(Number(block.timestamp))}`);
                    }
                } catch (error) {
                    if (error.code === 430) { // TransactionNotFound
                        // console.warn(`交易未找到：${txHash}`); // 可以取消注释以查看调试信息
                    } else {
                        console.error(`获取交易 ${txHash} 时出错：`, error);
                    }
                }
            }
            return transactions;
        }
        return [];
    } catch (error) {
        console.error(`获取区块 ${blockNumber} 的交易记录时出错：`, error);
        return [];
    }
}

// 获取交易的时间戳
async function getTransactionTimestamp(blockNumber) {
    const block = await web3.eth.getBlock(blockNumber);
    return Number(block.timestamp); // 确保时间戳为数字
}

// 格式化时间戳
function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000); // 将时间戳转换为 Date 对象
    return moment(date).format('YYYY/MM/DD GMT+8 HH:mm:ss');
}
