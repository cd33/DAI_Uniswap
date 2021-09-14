require("dotenv").config();
const { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType, Percent } = require('@uniswap/sdk');
const ethers = require('ethers');
 
const chainId = ChainId.ROPSTEN;
// const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI address mainnet
// const tokenAddress = "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa" // DAI address kovan
const tokenAddress = "0x31f42841c2db5173425b5223809cf3a38fede360" // DAI address ropsten
 
const init = async () => {
 const dai = await Fetcher.fetchTokenData(chainId, tokenAddress);
 const weth = WETH[chainId];
 const pair = await Fetcher.fetchPairData(dai, weth);
 const route = new Route([pair], weth);
 const trade = new Trade(route, new TokenAmount(weth, '100000000000000000'), TradeType.EXACT_INPUT);
 console.log(route.midPrice.toSignificant(6));
 console.log(route.midPrice.invert().toSignificant(6));
 console.log(trade.executionPrice.toSignificant(6));
 console.log(trade.nextMidPrice.toSignificant(6));
 
 const slippageTolerance = new Percent('50', '10000'); // tolérance prix 50 bips = 0.050%
 
 const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // minimum des tokens à récupérer avec une tolérance de 0.050%
 const path = [weth.address, dai.address]; // les tokens à échanger
 const to = process.env.ACCOUNT;
 const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // le délai après lequel le trade n’est plus valable 
 const value = trade.inputAmount.raw; // la valeur des ethers à envoyer
//  const inputAmountHex = ethers.BigNumber.from(value); 
// //  console.log("value", value)
// console.log(inputAmountHex)
 const provider = ethers.getDefaultProvider('ropsten', {
   infura: process.env.INFURA_ID
 }); // utilisation du provider infura pour effectuer une transaction  
 
 const signer = new ethers.Wallet(process.env.PRIVATE_KEY); // récupérer son wallet grâce au private key
 const account = signer.connect(provider); // récupérer l’account qui va effectuer la transaction 
 const uniswap = new ethers.Contract(
   '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
   ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
   account
 ); // récupérer le smart contract d’Uniswap avec l’adress du smart contract et l’ABI. Grâce à ethers on peut passer la fonction à utiliser en solidity 
 const tx = await uniswap.swapExactETHForTokens(
   String(amountOutMin),
   path,
   to,
   deadline,
   { value: String(value), gasPrice: 20e9 }
 ); // envoyer la transaction avec les bons paramètres 
 console.log(`Transaction hash: ${tx.hash}`); // afficher le hash de la transaction 
 
 const receipt = await tx.wait(); // récupérer la transaction receipt 
 console.log(`Transaction was mined in block ${receipt.blockNumber}`);
}
 
init();