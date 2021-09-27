const Web3 = require("web3");

async function main() {
    const Web3 = require("web3")
    // const web3 = new Web3("wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/ws")
    // const web3 = new Web3("wss://apis.ankr.com/wss/b1e0d936c6a84a7aa9f5caed17d44382/12b092c37506f14f5e16347e077f85b6/binance/full/main")
    // const web3 = new Web3("https://bsc-mainnet.web3api.com/v1/RV79ZV9G9VV5TT2T6SXZWKXICQ8AEHQNUQ")
    // const web3 = new Web3("")
    const web3 = new Web3("wss://bsc.getblock.io/mainnet/?api_key=03e21de6-4d4d-4800-baef-26effcc2f668")

    const database = new (require("./Database/Database"))
    await database.setup()

    const calculator = new (require("./Tools/Calculator"))

    const pancakeV1 = new (require("./Exchanges/Pancake/PancakeV1"))(web3)
    const pancakeV2 = new (require("./Exchanges/Pancake/PancakeV2"))(web3)
    const biswap = new (require("./Exchanges/Biswap/Biswap"))(web3)

    const fetcher = new (require("./Tools/PairFetcher"))(database, pancakeV1, pancakeV2, biswap)

    // const basicFactory = new (require("./Factories/BasicFactory"))(database, calculator, pancakeV1, pancakeV2, biswap)

    // const bnbAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    // const cakeAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
    // basicFactory.checkPair(bnbAddress, cakeAddress).then(result => {
    //     console.log(result["profit"] / 1E18, "BNB")
    //     console.log(result["profit"] / 1E18 * 350, "USD")
    // }).catch(reason => {
    //     console.log(reason)
    // })
    // const bestPairs = await basicFactory.getBestTokens()
    // for (const pair of bestPairs) {
    // break
    // }
}

main().then()