const {getMax, getMin} = require("../Tools/Helpers");
const {val} = require("truffle/build/484.bundled");

module.exports = class BasicFactory {
    constructor(database, calculator) {
        this.database = database
        this.calculator = calculator

        this.exchanges = []
        for (let i = 2; i < arguments.length; i++)
            this.exchanges.push(arguments[i])

        this.minProfitUSD = 0
        this.ethPrice = 350
        this.knownBorrowPairs = {}
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

            let result = await this.getBestProfit(pair, exchangeData)
            if (result["retry"])
                result = await this.getBestProfit(pair, exchangeData, true)

            console.log(result)

            resolve(0)
        })
    }

    async getBestProfit(pair, exchangeData, reversed = false) {
        return new Promise(async resolve => {
            const token0 = reversed ? pair["token1"] : pair["token0"]
            const token1 = reversed ? pair["token0"] : pair["token1"]

            let [extrema0, profit0, exchangeA0, exchangeB0] = await this.getBestInput(exchangeData, reversed)
            if (extrema0 < 0) return resolve({"retry": true})

            let [amountOut0, sellAt0] = await this.getBestETHExchange(profit0, token0)
            if (amountOut0 / 1E18 * this.ethPrice < this.minProfitUSD) return resolve({"retry": true})

            let [borrowReserve0, borrowAddress0] = await this.getBorrowPair(token0, token1, extrema0)

            if (borrowReserve0 > extrema0)
                return resolve({
                    "retry": false,
                    "token0": token0,
                    "token1": token1,
                    "borrowAddress": borrowAddress0,
                    "amountIn": Number(extrema0),
                    "exchangeA": exchangeA0,
                    "exchangeB": exchangeB0,
                    "exchangeC": sellAt0,
                    "profit": Number(amountOut0),
                    "profitUSD": Number(amountOut0 / 1E18 * this.ethPrice)
                })

            let [extrema1, profit1, exchangeA1, exchangeB1] = await this.getBestInput(exchangeData, reversed, borrowReserve0)
            if (extrema1 < 0) return resolve({"retry": true})

            let [amountOut1, sellAt1] = await this.getBestETHExchange(profit1, token0)
            if (amountOut1 / 1E18 * this.ethPrice < this.minProfitUSD) return resolve({"retry": true})

            let [borrowReserve1, borrowAddress1] = await this.getBorrowPair(token0, token1, extrema0)

            if (borrowReserve1 > extrema1){
                return resolve({
                    "retry": false,
                    "token0": token0,
                    "token1": token1,
                    "borrowAddress": borrowAddress1,
                    "amountIn": Number(extrema1),
                    "exchangeA": exchangeA1,
                    "exchangeB": exchangeB1,
                    "exchangeC": sellAt1,
                    "profit": Number(amountOut1),
                    "profitUSD": Number(amountOut1 / 1E18 * this.ethPrice)
                })
            }
            return resolve({"retry": true})
        })
    }

    async getBorrowPair(token0, token1, amountNeeded) {
        return new Promise(async resolve => {
            let promises = []
            if (this.knownBorrowPairs[token0] !== undefined) {
                for (const borrowPair of this.knownBorrowPairs[token0]) {
                    if (borrowPair["otherToken"] !== token1) {
                        promises.push(new Promise(async resolve => {
                            resolve({
                                "reserve": (await this.exchanges[0].getReservesFromPair(borrowPair["address"], token0))["reserve0"],
                                "address": borrowPair["address"]
                            })
                        }))
                    }
                }
                const results = await Promise.all(promises)
                const reserves = results.map(r => r["reserve"])
                const maxReserve = getMax(reserves)
                if (maxReserve > amountNeeded)
                    return resolve([maxReserve, results[reserves.indexOf(maxReserve)]["address"]])
            }

            const selectCommands = []
            for (const exchange of this.exchanges) {
                selectCommands.push(`
                    select address, token0, token1 from ${exchange.tableName} where (
                        (token0 = '${token0}' and token1 != '${token1}') or
                        (token1 = '${token0}' and token0 != '${token1}')
                    )
                `)
            }
            const validPairs = await this.database.custom(selectCommands.join(" union "))

            promises = []
            for (const validPair of validPairs) {
                promises.push(new Promise(async resolve => {
                    resolve({
                        "reserve": (await this.exchanges[0].getReservesFromPair(validPair["address"], token0))["reserve0"],
                        "otherToken": validPair["token0"] === token0 ? validPair["token1"] : validPair["token0"],
                        "address": validPair["address"]
                    })
                }))
            }
            const results = await Promise.all(promises)

            const reserves = results.map(r => r["reserve"])
            const maxReserve = getMax(reserves)
            const bestPair = results[reserves.indexOf(maxReserve)]
            if (maxReserve > amountNeeded) {
                const borrowPairData = {
                    "otherToken": bestPair["otherToken"],
                    "address": bestPair["address"]
                }
                if (this.knownBorrowPairs[token0] === undefined)
                    this.knownBorrowPairs[token0] = [borrowPairData]
                else
                    this.knownBorrowPairs[token0].append(borrowPairData)

                return resolve([maxReserve, bestPair["address"]])
            } else {
                return resolve([0, undefined])
            }
        })
    }

    async getBestInput(exchangeData, reversed, maxExtrema = undefined) {
        let bestInput = 0, profit = 0, exchangeA = undefined, exchangeB = undefined
        for (let i = 0; i < exchangeData.length; i++) {
            for (let j = i + 1; j < exchangeData.length; j++) {
                const exchangeAIndex = reversed ? j : i
                const exchangeBIndex = reversed ? i : j
                const params = [
                    exchangeData[exchangeAIndex]["reserve0"],
                    exchangeData[exchangeAIndex]["reserve1"],
                    exchangeData[exchangeAIndex]["swapFee"],
                    exchangeData[exchangeBIndex]["reserve0"],
                    exchangeData[exchangeBIndex]["reserve1"],
                    exchangeData[exchangeBIndex]["swapFee"],
                ]
                const tempExtrema = this.calculator.calculateSimpleExtrema(...params)
                if (tempExtrema > 0) {
                    const extrema = maxExtrema === undefined ? tempExtrema : getMin([tempExtrema, maxExtrema])
                    const tempProfit = this.calculator.calculateProfit(extrema, ...params)
                    if (tempProfit > profit) {
                        bestInput = extrema
                        profit = tempProfit
                        exchangeA = exchangeData[exchangeAIndex]["exchange"]
                        exchangeB = exchangeData[exchangeBIndex]["exchange"]
                    }
                }
            }
        }
        return [bestInput, profit, exchangeA, exchangeB]
    }

    async getBestETHExchange(amountIn, token) {
        let promises = []
        for (const exchange of this.exchanges) {
            promises.push(new Promise(async resolve => {
                resolve({
                    "amountOut": await exchange.swapToETH(amountIn, token),
                    "exchange": exchange.tableName
                })
            }))
        }
        const results = await Promise.all(promises)
        const amountsOut = results.map(r => r["amountOut"])
        const maxAmountOut = getMax(amountsOut)
        return [
            maxAmountOut,
            results[amountsOut.indexOf(maxAmountOut)]["exchange"],
        ]
    }
}
