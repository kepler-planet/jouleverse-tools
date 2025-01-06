const {Web3} = require('web3');
//const web3 = new Web3('https://rpc.jnsdao.com:8503');
const web3 = new Web3('http://localhost:8501'); 
const contractAddress = '0x9c100856f5C60a3ec87Aa408567304DB2AfC241F'; 

// 合约ABI
const contractAbi= [{"inputs":[{"internalType":"uint256","name":"planetId","type":"uint256"}],"name":"countPlanetAddresses","outputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"planetId","type":"uint256"},{"internalType":"uint256","name":"idx","type":"uint256"}],"name":"addressOnPlanet","outputs":[{"internalType":"address","name":"member","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

// 初始化合约实例
const contract = new web3.eth.Contract(contractAbi, contractAddress);

// 获取所有星球上的所有用户地址
async function getAllAddressesForAllPlanets() {
  const allAddresses = {};

  try {
    // 假设我们知道星球的最大ID
    const maxPlanetId = 13; // 根据实际情况调整

    for (let planetId = 0; planetId <= maxPlanetId; planetId++) {
      const count = await contract.methods.countPlanetAddresses(planetId).call();
      const addresses = [];

      for (let i = 0; i < count; i++) {
        const address = await contract.methods.addressOnPlanet(planetId, i).call();
        addresses.push(address);
      }

      allAddresses[planetId] = addresses;
    }

    console.log(allAddresses);
  } catch (error) {
    console.error('Error:', error);
  }
}

// 调用函数获取所有地址
getAllAddressesForAllPlanets();
