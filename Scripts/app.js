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

    const exchanges = [pancakeV1, pancakeV2, biswap]

    const tradeTester = new (require("./Tools/TradeTester"))(web3, ...exchanges)

    const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
    // const fetcher = new (require("./Tools/PairFetcher"))(database, ...exchanges)

    const basicFactory = new (require("./Factories/BasicFactory"))(database, calculator, ...exchanges)

    const bestPairs = await basicFactory.getBestTokens(10000)

    console.time("took")
    await basicFactory.checkPairs(bestPairs, 30, async results => {
        console.timeEnd("took")
        for (const result of results) {
            if (result["profit"] > 0) {
                let promises = []
                for (const exchange of exchanges)
                    promises.push(exchange.swapToETH(result["profit"], result["token0"]))

                const results = (await Promise.all(promises))

                const maxProfit = Math.max(...results).toString()

                const sellAt = countOccurrences(results, maxProfit) === results.length ?
                    undefined : exchanges[results.indexOf(maxProfit)]

                const maxProfitUSD = maxProfit / 1E18 * 350

                if (maxProfitUSD > 0.50) {
                    console.log({
                        "Profit USD": maxProfitUSD,
                        "Amount in": (result["amountIn"] / 1E18).toString(),
                        "Token0": result["token0"],
                        "Token1": result["token1"],
                        "Exchange0": result["firstExchange"].tableName,
                        "Exchange1": result["secondExchange"].tableName,
                        "SellAt": sellAt !== undefined ? sellAt.tableName : "Already BNB"
                    })
                    // console.log(`${maxProfitUSD}: ${result["token0"]} ${result["token1"]} ${result["firstExchange"].tableName} --> ${result["secondExchange"].tableName} (${result["amountIn"] / 1E18}) ${sellAt.tableName}`)
                    const profit = await tradeTester.testTrade(
                        result["token0"],
                        result["token1"],
                        result["amountIn"],
                        result["firstExchange"],
                        result["secondExchange"],
                        result["sellAt"]
                    )
                    console.log(`Calculated profit: ${profit}`)
                }
            }
        }
        console.time("took")
    })
}

main().then()