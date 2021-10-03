const {getMax, getMin} = require("../Tools/Helpers");

module.exports = class BasicFactory {
    constructor(database, calculator) {
        this.database = database
        this.calculator = calculator

        this.exchanges = []
        for (let i = 2; i < arguments.length; i++)
            this.exchanges.push(arguments[i])

        this.minProfitUSD = 0
    }

    async checkPairs(pairs, parallel, callbackFunction) {
        console.time(`Done fetching ${pairs.length} pairs`)
        let totalChecked = 0
        while (totalChecked < pairs.length) {
            let promises = []
            const number = parallel > pairs.length - totalChecked ? pairs.length - totalChecked : parallel
            for (let i = 0; i < number; i++)
                promises.push(this.checkPair(pairs[totalChecked + i]))

            totalChecked += number
            await Promise.all(promises).then(callbackFunction)
        }
        console.timeEnd(`Done fetching ${pairs.length} pairs`)
    }

    async checkPair(pair) {
        return new Promise(async resolve => {
            console.log(pair)
            const validExchangeNames = pair["exchanges"].split(",")
            let exchangeData = []
            let promises = []

            for (const exchange of this.exchanges.filter(e => validExchangeNames.includes(e.tableName))) {
                promises.push(new Promise(async resolve => {
                    const result = await exchange.getReserves(pair["token0"], pair["token1"])
                    result["exchange"] = exchange.tableName
                    exchangeData.push(result)
                    resolve()
                }))
            }
            await Promise.all(promises)

            const {reserve, address} = await this.getBorrowPairs(pair["token0"], pair["token1"])

            let bestInput = 0
            for (let exchangeAIndex = 0; exchangeAIndex < validExchangeNames.length; exchangeAIndex++) {
                for (let exchangeBIndex = 0; exchangeBIndex < validExchangeNames.length; exchangeBIndex++) {
                    if (exchangeAIndex === exchangeBIndex) continue

                    const params = [
                        exchangeData[exchangeAIndex]["reserve0"],
                        exchangeData[exchangeAIndex]["reserve1"],
                        exchangeData[exchangeAIndex]["swapFee"],
                        exchangeData[exchangeBIndex]["reserve0"],
                        exchangeData[exchangeBIndex]["reserve1"],
                        exchangeData[exchangeBIndex]["swapFee"],
                    ]
                    let extrema = this.calculator.calculateSimpleExtrema(...params)
                    console.log(extrema)
                }
            }

            resolve(0)
        })
    }

    async getBorrowPairs(token0, token1) {
        return new Promise(async resolve => {
            const selectCommands = []
            for (const exchange of this.exchanges) {
                selectCommands.push(`
                    select address, token0, token1, '${exchange.tableName}' as exchange from ${exchange.tableName} where (
                        (token0 = '${token0}' and token1 != '${token1}') or
                        (token1 = '${token0}' and token0 != '${token1}')
                    )
                `)
            }
            const validPairs = await this.database.custom(selectCommands.join(" union "))

            let maxLoanPair
            let maxLoan = 0
            let promises = []

            for (const pair of validPairs) {
                promises.push(new Promise(async resolve => {
                    const {reserve0, reserve1} = await this.exchanges[0].getReservesFromPair(pair["address"], token0)

                    if (reserve0 > maxLoan) {
                        maxLoan = reserve0
                        maxLoanPair = pair["address"]
                    }
                    resolve()
                }))
            }
            await Promise.all(promises)

            return resolve({
                "reserve": maxLoan,
                "address": maxLoanPair
            })
        })
    }

    async getProfitData(amountIn, token0) {
        if (profitAfterFee > 0) {
            let maxProfitETH
            if (token0 !== this.exchanges[0].WETH) {
                let tokensOut = []
                for (const exchange of this.exchanges)
                    tokensOut.push(await exchange.swapToETH(profitAfterFee, token0))

                maxProfitETH = getMax(tokensOut)
                return {
                    profitETH: maxProfitETH,
                    exchangeC: this.exchanges[tokensOut.indexOf(maxProfitETH)]
                }
            } else {
                return {
                    profitETH: profitAfterFee
                }
            }
        }
        return {
            profitETH: 0
        }
    }

    async getBestTokens(limit = 1E6, offset = 0) {
        return new Promise(async resolve => {
            let tableSelects = []
            for (const exchange of this.exchanges)
                tableSelects.push(`
                    select token0, token1, "${exchange.tableName}" as ex,
                           if(
                               token0 > token1,
                               concat(token0, token1),
                               concat(token1, token0)
                           ) as combined
                    from ${exchange.tableName}
                `)

            return resolve(this.database.custom(`
                select token0, token1, group_concat(ex) as exchanges
                from (
                    ${tableSelects.join(" union ")}
                )
                as a
                group by combined having count(*) > 1
                order by count(*) desc limit ${limit} offset ${offset}
            `))
        })
    }
}
