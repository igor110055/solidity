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

            let [extrema0, profit0, exchangeA0, exchangeB0] = await this.getBestInput(exchangeData)
            if (extrema0 <= 0) return resolve(0)

            let [borrowReserve0, borrowAddress0] = await this.getBorrowPair(pair["token0"], pair["token1"], extrema0)

            if (borrowReserve0 > extrema0) {
                let [amountOut0, exchangeC0] = await this.getBestETHExchange(extrema0, pair["token0"])
                return resolve(this.formatOutput(
                    extrema0, profit0, amountOut0, pair["token0"], pair["token1"],
                    borrowAddress0, exchangeA0, exchangeB0, exchangeC0)
                )
            }

            let [extrema1, profit1, exchangeA1, exchangeB1] = await this.getBestInput(exchangeData, true)
            if (extrema1 <= 0) return resolve(0)

            let [borrowReserve1, borrowAddress1] = await this.getBorrowPair(pair["token1"], pair["token0"], extrema1)

            if (borrowReserve1 > extrema1) {
                let [amountOut1, exchangeC1] = await this.getBestETHExchange(extrema0, pair["token0"])
                return resolve(this.formatOutput(
                    extrema1, profit1, amountOut1, pair["token1"], pair["token0"],
                    borrowAddress1, exchangeA1, exchangeB1, exchangeC1)
                )
            }

            resolve(0)
        })
    }

    async formatOutput(amountIn, amountOut, amountOutETH, token0, token1, borrowPair, exchangeA, exchangeB, exchangeC){
        return {
            "amountIn": amountIn,
            "amountOut": amountOut,
            "amountOutETH": amountOutETH,
            "token0": token0,
            "token1": token1,
            "borrowPair": borrowPair,
            "exchangeA": exchangeA,
            "exchangeB": exchangeB,
            "exchangeC": exchangeC,
        }
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
                console.log(maxReserve, amountNeeded, maxReserve > amountNeeded)
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

    async getBestInput(exchangeData, reversed = false, maxExtrema = undefined) {
        let bestInput = 0, profit = 0, exchangeA = undefined, exchangeB = undefined
        for (let i = 0; i < exchangeData.length; i++) {
            for (let j = i + 1; j < exchangeData.length; j++) {
                const params = [
                    exchangeData[i]["reserve" + (reversed ? "1" : "0")],
                    exchangeData[i]["reserve" + (reversed ? "0" : "1")],
                    exchangeData[i]["swapFee"],
                    exchangeData[j]["reserve" + (reversed ? "1" : "0")],
                    exchangeData[j]["reserve" + (reversed ? "0" : "1")],
                    exchangeData[j]["swapFee"],
                ]

                const tempExtrema = this.calculator.calculateSimpleExtrema(...params)
                if (tempExtrema > 0) {
                    const extrema = maxExtrema === undefined ? tempExtrema : getMin([tempExtrema, maxExtrema])
                    const tempProfit = this.calculator.calculateProfit(extrema, ...params)
                    if (tempProfit > profit) {
                        bestInput = extrema
                        profit = tempProfit
                        exchangeA = exchangeData[i]["exchange"]
                        exchangeB = exchangeData[j]["exchange"]
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
