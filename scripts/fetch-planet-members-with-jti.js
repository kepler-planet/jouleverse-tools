const {Web3} = require('web3');
//const web3 = new Web3('https://rpc.jnsdao.com:8503'); 
const web3 = new Web3('http://localhost:8501'); 
const moment = require('moment'); // 用于日期格式化

// 合约地址
const planetContractAddress = '0x9c100856f5C60a3ec87Aa408567304DB2AfC241F';
const configContractAddress = '0x77136ef358f55E20E7d51259fa47D3D68C9324db';
const identityContractAddress = '0x7e722837Ff19BE2687c2089DBf70D064fB9622AE';

// 合约ABI
const planetContractAbi = [{"inputs":[{"internalType":"uint256","name":"planetId","type":"uint256"}],"name":"countPlanetAddresses","outputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"planetId","type":"uint256"},{"internalType":"uint256","name":"idx","type":"uint256"}],"name":"addressOnPlanet","outputs":[{"internalType":"address","name":"member","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
const configContractAbi = [];
const identityContractAbi = [{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"verifierOfToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"planetVerify","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"sinceBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"sinceTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

// 初始化合约实例
const planetContract = new web3.eth.Contract(planetContractAbi, planetContractAddress);
const configContract = new web3.eth.Contract(configContractAbi, configContractAddress);
const identityContract = new web3.eth.Contract(identityContractAbi, identityContractAddress);

// 查询特定星球下的所有用户地址及其JTI认证信息
async function getAddressesForPlanetWithJTIInfo(planetId) {
  try {
    // 获取特定星球上的地址数量
    const count = await planetContract.methods.countPlanetAddresses(planetId).call();

    // 用于存储每个地址及其JTI认证信息的对象
    const addressesWithJTIInfo = [];

    // 遍历每个地址
    for (let i = 0; i < count; i++) {
      const address = await planetContract.methods.addressOnPlanet(planetId, i).call();

      // 获取用户持有的代币数量
      const balance = await identityContract.methods.balanceOf(address).call();

      let tokenId = '0';
      let jtiVerifier, jtiTimestamp, isVerified;

      if (balance > 0) {
        tokenId = await identityContract.methods.tokenOfOwnerByIndex(address, 0).call();

        if (tokenId !== '0') {
          // 获取JTI认证信息
          [jtiVerifier, _, _, jtiTimestamp] = await getJTIInfo(tokenId, identityContract);
          isVerified = '已认证';
        } else {
          jtiVerifier = null;
          jtiTimestamp = null;
          isVerified = '未认证';
        }
      } else {
        jtiVerifier = null;
        jtiTimestamp = null;
        isVerified = '未认证';
      }

      // 将 "address" 键名改为 "钱包地址"，"tokenId" 键名改为 "JTI编号"，并转换BigInt为字符串，"jtiVerifier" 键名改为 "JTI认证人"，
      // "jtiTimestamp" 键名改为 "认证日期"，并转换BigInt为字符串
      addressesWithJTIInfo.push({
        钱包地址: address,
        是否JTI认证: isVerified,
        JTI编号: tokenId.toString(),
        JTI见证人: jtiVerifier,
        认证日期: formatTimestamp(jtiTimestamp)
      });
    }

    console.log(`星球 ${planetId} 下的所有用户地址及其JTI认证信息:`, addressesWithJTIInfo);
  } catch (error) {
    console.error('Error:', error);
  }
}

// 获取JTI认证信息
async function getJTIInfo(tokenId, identityContract) {
  // 获取JTI认证信息
  const jtiVerifier = await identityContract.methods.verifierOfToken(tokenId).call();
  const jtiPlanet = await identityContract.methods.planetVerify(tokenId).call();
  const jtiBlock = await identityContract.methods.sinceBlock(tokenId).call();
  const jtiTimestamp = await identityContract.methods.sinceTimestamp(tokenId).call();

  return [jtiVerifier, jtiPlanet, jtiBlock, BigInt(jtiTimestamp)];
}

// 格式化时间戳为年/月/日格式
function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  return moment.unix(Number(timestamp)).format('YYYY/MM/DD');
}

// 调用函数获取特定星球下的所有用户地址及其JTI认证信息
getAddressesForPlanetWithJTIInfo(12); // 替换为您的星球ID
