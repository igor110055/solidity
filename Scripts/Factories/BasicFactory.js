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
                promises.push(this.checkPair(
                    pairs[totalChecked + i]["token0"],
                    pairs[totalChecked + i]["token1"]
                ))

            totalChecked += number
            await Promise.all(promises).then(callbackFunction)
        }
    }

    async checkPair(token0, token1) {
        return new Promise(async resolve => {
            let selectCommands = []
            for (const exchange of this.exchanges) {
                selectCommands.push(`select "${exchange.tableName}" as exchange, exists(
                    select 1 from ${exchange.tableName} where (
                        token0 = "${token0}" and
                        token1 = "${token1}"
                    ) or (
                        token1 = "${token0}" and
                        token0 = "${token1}"
                    )
                )`)
            }
            const results = await this.database.custom(selectCommands.join(" union "))

            if (results.length > 0) {
                const validExchangeNames = results.map(e => e["exchange"])
                let exchangesWithPair = []
                let exchangeData = []

                let promises = []
                for (const exchange of this.exchanges) {
                    if (validExchangeNames.includes(exchange.tableName)) {
                        promises.push(new Promise(async resolve => {
                            const [reserve0, reserve1, swapFee] = await exchange.getReserves(token0, token1)

                            exchangesWithPair.push(exchange)
                            exchangeData.push({
                                "reserve0": reserve0,
                                "reserve1": reserve1,
                                "swapFee": swapFee
                            })
                            resolve()
                        }))
                    }
                }
                await Promise.all(promises)

                if (exchangesWithPair.length > 1) {
                    let prices = exchangeData.map(d => d["reserve0"] / d["reserve1"])

                    const exchangeAIndex = prices.indexOf(Math.min(...prices))
                    const exchangeBIndex = prices.indexOf(Math.max(...prices))

                    const params = [
                        exchangeData[exchangeAIndex]["reserve0"],
                        exchangeData[exchangeAIndex]["reserve1"],
                        exchangeData[exchangeAIndex]["swapFee"],
                        exchangeData[exchangeBIndex]["reserve0"],
                        exchangeData[exchangeBIndex]["reserve1"],
                        exchangeData[exchangeBIndex]["swapFee"]
                    ]

                    const extrema = this.calculator.calculateSimpleExtrema(...params)
                    if (extrema > 0) {
                        const profit = this.calculator.calculateProfit(extrema, ...params)

                        return resolve({
                            "token0": token0,
                            "token1": token1,
                            "firstExchange": exchangesWithPair[exchangeAIndex],
                            "secondExchange": exchangesWithPair[exchangeBIndex],
                            "amountIn": extrema,
                            "profit": profit
                        })
                    }
                }
            }
            return resolve({
                "profit": 0
            })
        })
    }

    async getBestTokens(limit = 1000, offset = 0) {
        return new Promise(async resolve => {
            let tableSelects = []
            for (const exchange of this.exchanges)
                tableSelects.push(`
                    select address, token0, token1, if(
                        token0 > token1,
                        concat(token0, token1),
                        concat(token1, token0)
                    ) as combined
                    from ${exchange.tableName}
                `)

            return resolve(this.database.custom(`
                select token0, token1, count(*) as count from (
                     ${tableSelects.join(" union ")}
                )
                as a group by combined having count > 1
                order by count desc limit ${limit} offset ${offset}
            `))
        })
    }
}
