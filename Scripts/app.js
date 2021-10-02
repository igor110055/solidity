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

    const exchanges = [pancakeV1, pancakeV2, biswap]

    const tradeTester = new (require("./Tools/TradeTester"))(database)
    await tradeTester.setup()

    const basicFactory = new (require("./Factories/BasicFactory"))(database, calculator, ...exchanges)
    const bestPairs = await basicFactory.getBestTokens(1, 3169)

    new (require("./Tools/PairFetcher"))(database, ...exchanges)

    console.time("Fetching took")
    await basicFactory.checkPairs(bestPairs, 1, async results => {
        console.timeEnd("Fetching took")
        for (const result of results) {
            if (result["profit"] > 0) {
                console.log(result)
                console.log("Testing trade".green)
                const testResult = await tradeTester.testTrade(
                    result["token0"],
                    result["token1"],
                    result["amountIn"],
                    result["borrowPair"],
                    result["exchangeA"],
                    result["exchangeB"],
                    result["exchangeC"]
                )
                console.log(testResult)
            }
        }
        console.time("Fetching took")
    })
}


main().then()