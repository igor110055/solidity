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

    // const fetcher = new (require("./Tools/PairFetcher"))(database, ...exchanges)

    const basicFactory = new (require("./Factories/BasicFactory"))(database, calculator, ...exchanges)

    const bnbAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    const cakeAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
    // basicFactory.checkPair(bnbAddress, cakeAddress).then(result => {
    //     console.log(result["profit"] / 1E18, "BNB")
    //     console.log(result["profit"] / 1E18 * 350, "USD")
    // }).catch(reason => {
    //     console.log(reason)
    // })


    const totalAmount = 100000
    const parallel = 100
    const bestPairs = await basicFactory.getBestTokens(totalAmount)

    for (let i = 0; i < totalAmount / parallel; i++) {
        let promises = []
        for (let j = 0; j < parallel; j++) {
            if (i * parallel + j < bestPairs.length)
                promises.push(checkPair(basicFactory, exchanges, bestPairs[i * parallel + j]))
            else
                return
        }
        console.log(`(${i * parallel}/${bestPairs.length}) (${((i * parallel) / bestPairs.length * 100).toFixed(3)}%)`)
        const results = await Promise.all(promises)
        results.forEach(result => {
            if (result !== "Not profitable") {
                console.log(result)
            }
        })
    }
}

async function checkPair(basicFactory, exchanges, pair) {
    return new Promise(async resolve => {
        const result = await basicFactory.checkPair(pair["token0"], pair["token1"])

        if (result["profit"] > 0) {
            let maxProfitUSD = 0
            let sellAt = undefined
            for (const exchange of exchanges) {
                const profitUSD = (await exchange.swapToETH(result["profit"], pair["token0"])) / 1E18 * 350

                if (profitUSD > maxProfitUSD) {
                    maxProfitUSD = profitUSD
                    sellAt = exchange
                }
            }

            if (maxProfitUSD > 0.50)
                // return resolve({
                //     "Profit USD": maxProfitUSD,
                //     "Amount in": result["amountIn"] / 1E18,
                //     "Token0": pair["token0"],
                //     "Token1": pair["token1"],
                //     "Exchange0": result["firstExchange"].tableName,
                //     "Exchange1": result["secondExchange"].tableName,
                //     "SellAt": sellAt.tableName
                // })
                return resolve(`${maxProfitUSD}: ${pair["token0"]} ${pair["token1"]} ${result["firstExchange"].tableName} --> ${result["secondExchange"].tableName} (${result["amountIn"] / 1E18}) ${sellAt.tableName}`)
            else {
                return resolve("Not profitable")
            }
        } else {
            return resolve("Not profitable")
        }
    })
}

main().then()