module.exports = class BasicFactory {
    constructor(database, calculator) {
        this.database = database
        this.calculator = calculator

        this.exchanges = []
        for (let i = 2; i < arguments.length; i++)
            this.exchanges.push(arguments[i])
    }

    async checkPairs(pairs, parallel, callbackFunction) {
        let totalChecked = 0
        while (totalChecked < pairs.length) {
            let promises = []
            const number = parallel > pairs.length - totalChecked ? pairs.length - totalChecked : parallel
            for (let i = 0; i < number; i++)
                promises.push(this.checkPair(pairs[totalChecked + i]))

            totalChecked += number
            await Promise.all(promises).then(callbackFunction)
        }
    }

    async checkPair(pair) {
        return new Promise(async resolve => {
            const validExchangeNames = pair["exchanges"].split(",")

            let exchangesWithPair = []
            let exchangeData = []

            let promises = []
            for (const exchange of this.exchanges) {
                if (validExchangeNames.includes(exchange.tableName)) {
                    promises.push(new Promise(async resolve => {
                        const [reserve0, reserve1, swapFee] = await exchange.getReserves(pair["token0"], pair["token1"])

                        if (reserve0 !== "0" && reserve1 !== "0") {
                            exchangesWithPair.push(exchange)
                            exchangeData.push({
                                "reserve0": reserve0,
                                "reserve1": reserve1,
                                "swapFee": swapFee
                            })
                        }
                        resolve()
                    }))
                }
            }
            await Promise.all(promises)

            if (exchangeData.length > 1) {
                let prices = exchangeData.map(d => d["reserve0"] / d["reserve1"])

                const exchangeAIndex = prices.indexOf(Math.min(...prices))
                const exchangeBIndex = prices.indexOf(Math.max(...prices))

                let params
                try {
                    params = [
                        exchangeData[exchangeAIndex]["reserve0"],
                        exchangeData[exchangeAIndex]["reserve1"],
                        exchangeData[exchangeAIndex]["swapFee"],
                        exchangeData[exchangeBIndex]["reserve0"],
                        exchangeData[exchangeBIndex]["reserve1"],
                        exchangeData[exchangeBIndex]["swapFee"]
                    ]
                } catch {
                    console.log(exchangeData)
                    console.log(prices)
                    console.log(exchangeAIndex, exchangeBIndex)
                }

                const extrema = this.calculator.calculateSimpleExtrema(...params)
                if (extrema > 0) {
                    const profit = this.calculator.calculateProfit(extrema, ...params)

                    return resolve({
                        "token0": pair["token0"],
                        "token1": pair["token1"],
                        "firstExchange": exchangesWithPair[exchangeAIndex],
                        "secondExchange": exchangesWithPair[exchangeBIndex],
                        "amountIn": extrema,
                        "profit": profit
                    })
                }
            }
            return resolve({
                "profit": 0
            })
        })
    }

    async getBestTokens(limit = 1000, offset = 0) {
        limit = Math.min(limit, 9000)
        return new Promise(async resolve => {
            let tableSelects = []
            for (const exchange of this.exchanges)
                tableSelects.push(`
                    select token0,
                           token1,
                           "${exchange.tableName}" as ex,
                           if(
                                       token0 > token1,
                                       concat(token0, token1),
                                       concat(token1, token0)
                               )                   as combined
                    from ${exchange.tableName}
                `)

            return resolve(this.database.custom(`
                select token0, token1, group_concat(ex) as exchanges
                from (
                         ${tableSelects.join(" union ")}
                         )
                         as a
                group by combined
                having count(*) > 1
                order by count(*) desc
                limit ${limit} offset ${offset}
            `))
        })
    }
}
