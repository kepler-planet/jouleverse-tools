const {Web3} = require('web3');
//const web3 = new Web3('https://rpc.jnsdao.com:8503');
const web3 = new Web3('http://localhost:8501'); 
const contractAddress = '0x9c100856f5C60a3ec87Aa408567304DB2AfC241F'; 

const contractAbi= [{"inputs":[{"internalType":"uint256","name":"planetId","type":"uint256"}],"name":"countPlanetAddresses","outputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"planetId","type":"uint256"},{"internalType":"uint256","name":"idx","type":"uint256"}],"name":"addressOnPlanet","outputs":[{"internalType":"address","name":"member","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

// 初始化合约实例
const contract = new web3.eth.Contract(contractAbi, contractAddress);

// 获取特定星球上的所有用户地址
async function getAllAddressesForPlanet(planetId) {
  // 创建一个空数组来存储地址
  let addresses = [];

  // 调用合约中的方法获取集合大小
  const count = await contract.methods.countPlanetAddresses(planetId).call();

  // 遍历集合，获取每个地址
  for (let i = 0; i < count; i++) {
    const address = await contract.methods.addressOnPlanet(planetId, i).call();
    addresses.push(address);
  }

  return addresses;
}

// 调用函数获取地址
getAllAddressesForPlanet(12) // 替换为您的星球ID
  .then(addresses => {
    console.log('Addresses:', addresses);
  })
  .catch(error => {
    console.error('Error:', error);
  });
