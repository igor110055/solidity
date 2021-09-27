module.exports = class BasicFactory {
    constructor(database, calculator) {
        this.database = database
        this.calculator = calculator

        this.exchanges = []
        for (let i = 2; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])
        }

        this.WETH = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    }

    async checkPair(token0, token1) {
        return new Promise(async (resolve, reject) => {
            let allExchanges = []
            let allPairs = []
            for (const exchange of this.exchanges) {
                const pairs = await this.database.getData(exchange.tableName, "*", `
                    where 
                        (token0 = "${token0}" and token1 = "${token1}") 
                    or
                        (token0 = "${token1}" and token1 = "${token0}")
                `)

                if (pairs.length > -1) {
                    let pair = pairs[0]
                    pair = {
                        number: 1,
                        address: "something",
                        token0: token0,
                        token1: token1
                    }
                    const [reserve0, reserve1, swapFee] = await exchange.getReserves(token0, token1)

                    pair["reserve0"] = reserve0
                    pair["reserve1"] = reserve1
                    pair["swapFee"] = swapFee

                    allExchanges.push(exchange)
                    allPairs.push(pair)
                }
            }

            if (allPairs.length > 1) {
                let maxProfit = 0
                let firstExchange, secondExchange, amountIn
                for (let exchangeA = 0; exchangeA < allExchanges.length; exchangeA++) {
                    for (let exchangeB = 0; exchangeB < allExchanges.length; exchangeB++) {
                        if (exchangeA !== exchangeB) {
                            const params = [
                                allPairs[exchangeA]["reserve0"],
                                allPairs[exchangeA]["reserve1"],
                                allPairs[exchangeA]["swapFee"],
                                allPairs[exchangeB]["reserve0"],
                                allPairs[exchangeB]["reserve1"],
                                allPairs[exchangeB]["swapFee"]
                            ]

                            const extrema = this.calculator.calculateSimpleExtrema(...params)
                            if (extrema > 0) {
                                const profit = this.calculator.calculateProfit(extrema, ...params)

                                if (profit > maxProfit) {
                                    maxProfit = profit
                                    firstExchange = allExchanges[exchangeA]
                                    secondExchange = allExchanges[exchangeB]
                                    amountIn = extrema
                                }
                            }
                        }
                    }
                }
                if (maxProfit > 0) {
                    return resolve({
                        "firstExchange": firstExchange,
                        "secondExchange": secondExchange,
                        "amountIn": amountIn,
                        "profit": maxProfit
                    })
                } else {
                    return reject("Not profitable.")
                }
            }
            return reject("Not enough exchanges support this pair.")
        })
    }

    async getBestTokens(limit = 100, offset = 0) {
        return new Promise(async resolve => {
            let tableSelects = []
            for (const exchange of this.exchanges) {
                // @formatter:off
                tableSelects.push(`
                    select *, 
                       case when token0>token1 then 
                           token0 || token1
                       else 
                           token1 || token0 
                       end as combined 
                    from ${exchange.tableName}
                `)
                // @formatter:on
            }
            // @formatter:off
            return resolve(await this.database.customGetCommand(`
                select address, token0, token1, count(*) as count from (
                     ${tableSelects.join(" union ")}
                )
                group by combined
                having count > 1
                order by count desc
                limit ${limit}
                offset ${offset}
            `))
            // @formatter:on
        })
    }
}
