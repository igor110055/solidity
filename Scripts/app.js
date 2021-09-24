const Web3 = require("web3")
const web3 = new Web3("wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/ws")

const database = new (require("./Database/Database"))
const pancake = new (require("./Exchanges/Pancake/Pancake"))(web3)
const biswap = new (require("./Exchanges/Biswap/Biswap"))(web3)

const fetcher = new (require("./PairFetcher"))
fetcher.updateDatabase(pancake, database, "PancakePairs").then()
fetcher.updateDatabase(biswap, database, "BiswapPairs").then()
