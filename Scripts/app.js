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

    // const fetcher = new (require("./Tools/PairFetcher"))(database, ...exchanges)

    const basicFactory = new (require("./Factories/BasicFactory"))(database, calculator, ...exchanges)

    const bestPairs = await basicFactory.getBestTokens(10000)

    console.time("took")
    await basicFactory.checkPairs(bestPairs, 30, async results => {
        console.timeEnd("took")
        for (const result of results) {
            if (result["profit"] > 0) {
                let maxProfit, sellAt
                if (result["token0"] !== exchanges[0].WETH) {
                    let promises = []
                    for (const exchange of exchanges)
                        promises.push(exchange.swapToETH(result["profit"], result["token0"]))

                    const results = await Promise.all(promises)
                    console.timeEnd("test")
                    const maxProfit = Math.max(...results).toString()
                    sellAt = exchanges[results.indexOf(maxProfit)]
                } else {
                    maxProfit = result["profit"]
                }

                const maxProfitUSD = maxProfit / 1E18 * 350

                if (maxProfitUSD > 0.50) {
                    console.log({
                        "ProfitUSD": maxProfitUSD,
                        "AmountIn": (result["amountIn"] / 1E18).toString(),
                        "Token0": result["token0"],
                        "Token1": result["token1"],
                        "Exchange0": result["firstExchange"].tableName,
                        "Exchange1": result["secondExchange"].tableName,
                        "SellAt": sellAt !== undefined ? sellAt.tableName : "Already BNB"
                    })
                }
            }
        }
        console.time("took")
    })
}

main().then()