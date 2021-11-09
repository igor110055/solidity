const {doAsync, getExchangeAddress, web3} = require("./Tools/Helpers")

async function main() {
    const options = {
        timeout: 30000,
        clientConfig: {
            keepalive: true,
            keepaliveInterval: 60000
        },
        reconnect: {
            auto: true,
            delay: 5000,
            maxAttempts: 999999,
            onTimeout: true
        }
    }

    // Notes:
    // Moralis: 3k per Minute
    // Ankr: 20 per Second (1.2k per Minute)
    // BSC: 2k per Minute

    const database = new (require("./Database/Database"))
    await database.setup()

    // const calculator = new (require("./Tools/Calculator"))

    const exchanges = [
        // new (require("./Exchanges/ApeSwap/ApeSwap"))(web3),
        new (require("./Exchanges/Biswap/Biswap"))(web3),
        // new (require("./Exchanges/BurgerSwap/BurgerSwap"))(web3),
        // new (require("./Exchanges/CheeseSwap/CheeseSwap"))(web3),
        // new (require("./Exchanges/HyperJump/HyperJump"))(web3),
        // new (require("./Exchanges/JetSwap/JetSwap"))(web3),
        // new (require("./Exchanges/JulSwap/JulSwap"))(web3),
        // new (require("./Exchanges/Mdex/Mdex"))(web3),
        // new (require("./Exchanges/Pancake/PancakeV1"))(web3),
        new (require("./Exchanges/Pancake/PancakeV2"))(web3),
        // new (require("./Exchanges/WaultSwap/WaultSwap"))(web3)
    ]

    for (const exchange of exchanges) {
        await database.createTable(exchange.tableName, exchange.tableStructure)
    }

    const pairFetcher = new (require("./Tools/PairFetcher"))(database, ...exchanges)
    await pairFetcher.start()

    const pairFilter = new (require("./Tools/PairFilter"))(database, ...exchanges)
    await pairFilter.setup()
    await pairFilter.start()

    // const tradeTester = new (require("./Tools/TradeTester"))(database)
    // await tradeTester.setup()

    // const basicFactory = new (require("./Factories/BasicFactory"))(database, calculator, ...exchanges)
    // const bestPairs = await basicFactory.getBestTokens()

    // await basicFactory.checkPairs(bestPairs, 5, async results => {
    //     await doAsync(results, async result => {
    //         if (result["profit"] !== undefined) {
    //             console.log(`Testing trade (${result["profitUSD"].toFixed(2)}$)`)
    //             const temp = new Promise(async resolve => {
    //                 tradeTester.testTrade(
    //                     result["token0"], result["token1"], result["amountIn"], result["borrowPair"],
    //                     getExchangeAddress(exchanges, result["exchangeA"]),
    //                     getExchangeAddress(exchanges, result["exchangeB"]),
    //                     getExchangeAddress(exchanges, result["exchangeC"])
    //                 ).then(profitETH => {
    //                     console.log("\x1b[32mTrade completed:", (profitETH / 1E18 * 420).toFixed(2), "$\x1b[0m", result["token0"], result["token1"])
    //                     resolve()
    //                 }).catch(error => {
    //                     console.log("\x1b[31mTrade failed\x1b[0m:", error)
    //                     resolve()
    //                 })
    //             })
    //             await temp
    //         }
    //     })
    // })
}


main().then()