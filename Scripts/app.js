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
    const info = {
        ProfitUSD: 59.642381824512725,
        AmountIn: '6.1467769909912e-11',
        Token0: '0x2cD1075682b0FCCaADd0Ca629e138E64015Ba11c',
        Token1: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        Exchange0: 'PancakeV2Pairs',
        Exchange1: 'PancakeV1Pairs',
        SellAt: 'Already BNB'
    }

    const result = await tradeTester.testTrade(
        info["Token0"],
        info["Token1"],
        info["AmountIn"],
        info["Exchange0"],
        info["Exchange1"],
        info["SellAt"]
    )
    console.log(result)

    // const fetcher = new (require("./Tools/PairFetcher"))(database, ...exchanges)

    /*
    const basicFactory = new (require("./Factories/BasicFactory"))(database, calculator, ...exchanges)

    const bestPairs = await basicFactory.getBestTokens(15000)

    console.time("Fetching took")
    await basicFactory.checkPairs(bestPairs, 100, async results => {
        console.timeEnd("Fetching took")

        let promises = []
        for (let i = 0; i < results.length; i++) {
            if (results[i]["profit"] > 0 && results[i]["token0"] !== exchanges[0].WETH) {
                promises.push(new Promise(async resolve => {
                    let tokensOut = []
                    for (const exchange of exchanges)
                        tokensOut.push(await exchange.swapToETH(results[i]["profit"], results[i]["token0"]))

                    const maxProfit = Math.max(...tokensOut).toString()
                    results[i]["maxProfit"] = maxProfit
                    results[i]["sellAt"] = exchanges[tokensOut.indexOf(maxProfit)]
                    resolve()
                }))
            }
        }

        await Promise.all(promises)

        for (const result of results) {
            if (result["profit"] > 0) {
                const maxProfitUSD = result["maxProfit"] / 1E18 * 350
                if (maxProfitUSD > 0.50) {
                    console.log({
                        "ProfitUSD": maxProfitUSD,
                        "AmountIn": (result["amountIn"] / 1E18).toString(),
                        "Token0": result["token0"],
                        "Token1": result["token1"],
                        "Exchange0": result["firstExchange"].tableName,
                        "Exchange1": result["secondExchange"].tableName,
                        "SellAt": result["sellAt"] !== undefined ? result["sellAt"].tableName : "Already BNB"
                    })
                }
            }
        }
        console.time("Fetching took")
    })
    */
}


main().then()