const {doAsync, getExchangeAddress} = require("./Tools/Helpers")

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
            onTimeout: false
        }
    }

    const links = [
        "wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/ws",
        "wss://apis.ankr.com/wss/b1e0d936c6a84a7aa9f5caed17d44382/12b092c37506f14f5e16347e077f85b6/binance/full/main",
        "https://bsc-mainnet.web3api.com/v1/RV79ZV9G9VV5TT2T6SXZWKXICQ8AEHQNUQ",
        "wss://bsc.getblock.io/mainnet/?api_key=03e21de6-4d4d-4800-baef-26effcc2f668"
    ]

    const Web3 = require("web3")
    const web3 = new Web3(new (require("web3-providers-ws"))(links[3], options))

    const database = new (require("./Database/Database"))
    await database.setup()

    const calculator = new (require("./Tools/Calculator"))

    const exchanges = [
        new (require("./Exchanges/ApeSwap/ApeSwap"))(web3),
        new (require("./Exchanges/Biswap/Biswap"))(web3),
        new (require("./Exchanges/BurgerSwap/BurgerSwap"))(web3),
        new (require("./Exchanges/CheeseSwap/CheeseSwap"))(web3),
        new (require("./Exchanges/HyperJump/HyperJump"))(web3),
        new (require("./Exchanges/JetSwap/JetSwap"))(web3),
        new (require("./Exchanges/JulSwap/JulSwap"))(web3),
        new (require("./Exchanges/Mdex/Mdex"))(web3),
        new (require("./Exchanges/Pancake/PancakeV1"))(web3),
        new (require("./Exchanges/Pancake/PancakeV2"))(web3),
        new (require("./Exchanges/WaultSwap/WaultSwap"))(web3)
    ]

    for (const exchange of exchanges) {
        await database.createTable(exchange.tableName, {
            "number": "int primary key auto_increment",
            "address": "varchar(45) unique",
            "token0": "int",
            "token1": "int",
        })
    }

    new (require("./Tools/PairFetcher"))(database, ...exchanges)

    const tradeTester = new (require("./Tools/TradeTester"))(database)
    await tradeTester.setup()

    const basicFactory = new (require("./Factories/BasicFactory"))(database, calculator, ...exchanges)
    const bestPairs = await basicFactory.getBestTokens()

    await basicFactory.checkPairs(bestPairs, 5, async results => {
        await doAsync(results, async result => {
            if (result["profit"] !== undefined) {
                console.log(`Testing trade (${result["profitUSD"].toFixed(2)}$)`)
                const temp = new Promise(async resolve => {
                    tradeTester.testTrade(
                        result["token0"], result["token1"], result["amountIn"], result["borrowPair"],
                        getExchangeAddress(exchanges, result["exchangeA"]),
                        getExchangeAddress(exchanges, result["exchangeB"]),
                        getExchangeAddress(exchanges, result["exchangeC"])
                    ).then(profitETH => {
                        console.log("\x1b[32mTrade completed:", (profitETH / 1E18 * 420).toFixed(2), "$\x1b[0m", result["token0"], result["token1"])
                        resolve()
                    }).catch(error => {
                        console.log("\x1b[31mTrade failed\x1b[0m:", error)
                        resolve()
                    })
                })
                await temp
            }
        })
    })
}


main().then()