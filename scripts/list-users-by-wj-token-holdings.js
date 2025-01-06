const {Web3} = require('web3');
//const web3 = new Web3('https://rpc.jnsdao.com:8503'); 
const web3 = new Web3('http://localhost:8501'); 
const fs = require('fs');

// 获取当前时间
const date = new Date();
//console.log("默认时区：");
//console.log(date);
// 获取时区偏移量，单位是毫秒，对于UTC+8就是 8 * 60 * 60 * 1000
const offset = 8 * 60 * 60 * 1000;
// 修正时间，给当前时间加上时区偏移量
const localDate = new Date(date.getTime() + offset);
//console.log("UTC/GMT+08:00：");
//console.log(localDate);
const timestamp = localDate.toISOString().split('T')[0].replace(/-/g, '');

// 合约地址
const planetContractAddress = '0x9c100856f5C60a3ec87Aa408567304DB2AfC241F';
const configContractAddress = '0x77136ef358f55E20E7d51259fa47D3D68C9324db';
const identityContractAddress = '0x7e722837Ff19BE2687c2089DBf70D064fB9622AE';
const wjTokenContractAddress = '0x7fba9BB966189Db8C4fE33B7bf67Bfa24203c6AD';

// 合约ABI
const planetContractAbi = [{"inputs":[{"internalType":"uint256","name":"planetId","type":"uint256"}],"name":"countPlanetAddresses","outputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"planetId","type":"uint256"},{"internalType":"uint256","name":"idx","type":"uint256"}],"name":"addressOnPlanet","outputs":[{"internalType":"address","name":"member","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
const configContractAbi = [];
const identityContractAbi = [{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"verifierOfToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"planetVerify","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"sinceBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"sinceTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
const wjTokenContractAbi = [
    {"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},
    // 其他可能需要的方法...
];

// 初始化合约实例
const planetContract = new web3.eth.Contract(planetContractAbi, planetContractAddress);
const configContract = new web3.eth.Contract(configContractAbi, configContractAddress);
const identityContract = new web3.eth.Contract(identityContractAbi, identityContractAddress);
const wjTokenContract = new web3.eth.Contract(wjTokenContractAbi, wjTokenContractAddress);

// 已知的星球最大ID
const maxPlanetId = 13;

async function listUsersByWJTokenHoldings() {
    try {
        // 创建一个数组来存储所有用户的地址及其拥有的WJ token数量
        const addressesWithWJTokens = [];

        // 遍历每个星球
        for (let planetId = 0; planetId <= maxPlanetId; planetId++) {
            // 获取特定星球上的地址数量
            const count = await planetContract.methods.countPlanetAddresses(planetId).call();

            // 遍历每个地址
            for (let i = 0; i < count; i++) {
                const address = await planetContract.methods.addressOnPlanet(planetId, i).call();

                // 获取用户持有的WJ token数量
                const balance = await wjTokenContract.methods.balanceOf(address).call();
                console.log(`Address ${address} has WJ_token balance of ${balance}`);

                // 确保balance是一个有效的BigInt值
                const bigIntBalance = BigInt(balance);
                addressesWithWJTokens.push({
                    钱包地址: address,
                    WJ_token数量: bigIntBalance
                });

                // 检查是否正确推送到数组
                console.log('Added user:', addressesWithWJTokens[addressesWithWJTokens.length - 1]);
            }
        }

        // 输出排序前的结果
        console.log('Before sorting:');
        addressesWithWJTokens.forEach((user, index) => console.log(`${index + 1}: ${user}`));

        // 使用JavaScript的sort方法对数组中的对象按WJ token数量降序排序
        addressesWithWJTokens.sort((a, b) => {
            if (a.WJ_token数量 > b.WJ_token数量) {
                return -1;
            } else if (a.WJ_token数量 < b.WJ_token数量) {
                return 1;
            } else {
                return 0;
            }
        });

        // 给排序后的结果加上序号，并重新构建对象
        const sortedUsersWithSeqNumbers = addressesWithWJTokens.map((user, index) => {
            // 将BigInt值转换为带有小数点的字符串
            const formattedBalance = (Number(user.WJ_token数量) / Math.pow(10, 18)).toFixed(18);
            return {
                序号: index + 1,
                钱包地址: user.钱包地址,
                WJ_token数量: formattedBalance
            };
        });

        // 输出排序后的结果
        console.log('After sorting:');
        sortedUsersWithSeqNumbers.forEach((user, index) => console.log(`${user.序号}: ${user}`));

        // 将排序后的结果写入文件
	const outputFileName = `WJTokenHoldings-${timestamp}.txt`;
	fs.writeFileSync(outputFileName, JSON.stringify(sortedUsersWithSeqNumbers, null, 4), 'utf8');

        console.log('按WJ token数量降序排列的所有用户地址列表:', sortedUsersWithSeqNumbers);
    } catch (error) {
        console.error('Error:', error);
    }
}

// 调用函数获取所有星球下的所有用户地址，并按照WJ token数量排序
listUsersByWJTokenHoldings();
