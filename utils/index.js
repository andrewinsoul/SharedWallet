const ethers = require("ethers");
const parse2Int = (ethBigNumber) =>
  Number(ethers.utils.formatEther(ethBigNumber)); // convert ethereum big number to a number javascript understands
module.exports = parse2Int;
