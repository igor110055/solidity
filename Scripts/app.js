const Web3 = require("web3")
// const web3 = new Web3("wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/ws")
// const web3 = new Web3("wss://apis.ankr.com/wss/b1e0d936c6a84a7aa9f5caed17d44382/12b092c37506f14f5e16347e077f85b6/binance/full/main")
// const web3 = new Web3("https://bsc-mainnet.web3api.com/v1/RV79ZV9G9VV5TT2T6SXZWKXICQ8AEHQNUQ")
// const web3 = new Web3("")
const web3 = new Web3("wss://bsc.getblock.io/mainnet/?api_key=03e21de6-4d4d-4800-baef-26effcc2f668")

const database = new (require("./Database/Database"))
const pancake = new (require("./Exchanges/Pancake/Pancake"))(web3)
const biswap = new (require("./Exchanges/Biswap/Biswap"))(web3)

const fetcher = new (require("./PairFetcher"))(database,
    [pancake, "PancakePairs"],
    [biswap, "BiswapPairs"]
)
