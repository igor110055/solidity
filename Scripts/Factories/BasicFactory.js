const {getMax, doAsync} = require("../Tools/Helpers");

module.exports = class BasicFactory {
    constructor(database, calculator) {
        this.database = database
        this.calculator = calculator
        this.fs = require("fs")

        this.exchanges = []
        for (let i = 2; i < arguments.length; i++)
            this.exchanges.push(arguments[i])

        this.minProfitUSD = 0.6
        this.ethPrice = 650
        this.toUSD = eth => {
            return eth / 1E18 * this.ethPrice
        }

        this.knownBorrowPairsFilePath = "./Factories/borrowPairs.json"
        try {
            this.knownBorrowPairs = JSON.parse(this.fs.readFileSync(this.knownBorrowPairsFilePath).toString())
        } catch {
            this.knownBorrowPairs = {
                "1": [
                    {
                        "otherTokenID": 45,
                        "address": "0x804678fa97d91B974ec2af3c843270886528a9E6"
                    },
                    {
                        "otherTokenID": 2,
                        "address": "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0"
                    }
                ],
                "45": [
                    {
                        "otherTokenID": 1,
                        "address": "0x804678fa97d91B974ec2af3c843270886528a9E6"
                    },
                    {
                        "otherTokenID": 2,
                        "address": "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16"
                    }
                ],
                "2": [
                    {
                        "otherTokenID": 45,
                        "address": "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16"
                    },
                    {
                        "otherTokenID": 1,
                        "address": "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0"
                    },
                    {
                        "otherTokenID": 7,
                        "address": "0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE"
                    }
                ],
                "7": [
                    {
                        "otherTokenID": 2,
                        "address": "0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE"
                    }
                ]
            }
        }
    }


    async getBestTokens(limit = 1E6, offset = 0) {
        return new Promise(async resolve => {
            let tableSelects = []
            for (const exchange of this.exchanges)
                tableSelects.push(`
                    select address, token0, token0 as 'token0ID', token1, token1 as 'token1ID', "${exchange.tableName}" as ex,
                           if(
                               token0 > token1,
                               concat(token0, ',', token1),
                               concat(token1, ',', token0)
                           ) as combined
                    from ${exchange.tableName}
                `)

            return resolve(this.database.custom(`
                select address, T1.tokenAddress as 'token0', token0ID, T2.tokenAddress as 'token1', token1ID, group_concat(ex) as exchanges
                from (
                    ${tableSelects.join(" union ")}
                )
                as data inner join Tokens as T1 on T1.tokenID = token0 inner join Tokens as T2 on T2.tokenID = token1
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
            const results = await Promise.all(promises)
            await callbackFunction(results)
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
            if (extrema0 <= 0 || profit0 <= 0) return resolve(0)

            let [amountOut0, exchangeC0] = await this.getBestETHExchange(profit0, pair["token0"])

            let amountOutUSD0 = this.toUSD(amountOut0)
            if (amountOutUSD0 < this.minProfitUSD) return resolve(0)

            let [borrowReserve0, borrowAddress0] = await this.getBorrowPair(pair["token0"], pair["token0ID"], pair["token1"], pair["token1ID"], extrema0)
            if (BigInt(borrowReserve0) >= BigInt(extrema0)) {
                return resolve(this.formatOutput(
                    extrema0, profit0, amountOut0, amountOutUSD0, pair["token0"], pair["token1"],
                    borrowAddress0, exchangeA0, exchangeB0, exchangeC0
                ))
            } else if (BigInt(borrowReserve0) > 0) {
                [extrema0, profit0, exchangeA0, exchangeB0] = await this.getBestInput(exchangeData, false, borrowReserve0);
                [amountOut0, exchangeC0] = await this.getBestETHExchange(profit0, pair["token0"])
                amountOutUSD0 = this.toUSD(amountOut0)
            }

            // Reversed (Token1 --> Token0)
            let [extrema1, profit1, exchangeA1, exchangeB1] = await this.getBestInput(exchangeData, true)
            let [amountOut1, exchangeC1] = await this.getBestETHExchange(profit1, pair["token1"])
            let amountOutUSD1 = this.toUSD(amountOut1)
            if (amountOutUSD1 < this.minProfitUSD) return resolve(0)

            let [borrowReserve1, borrowAddress1] = await this.getBorrowPair(pair["token1"], pair["token1ID"], pair["token0"], pair["token0ID"], extrema1)

            if (BigInt(borrowReserve1) > BigInt(extrema1)) {
                if (exchangeA1 === undefined)
                    return resolve(this.formatOutput(
                        extrema1, profit1, amountOut1, amountOutUSD1, pair["token1"], pair["token0"],
                        borrowAddress1, exchangeA1, exchangeB1, exchangeC1
                    ))
            } else {
                [extrema1, profit1, exchangeA1, exchangeB1] = await this.getBestInput(exchangeData, true, borrowReserve1);
                [amountOut1, exchangeC1] = await this.getBestETHExchange(profit1, pair["token1"])
                amountOutUSD1 = this.toUSD(amountOut1)

                if (amountOutUSD0 > this.minProfitUSD || amountOutUSD1 > this.minProfitUSD) {
                    if (amountOutUSD0 > amountOutUSD1) {
                        if (exchangeA0 === undefined) {
                            return resolve(this.formatOutput(
                                extrema0, profit0, amountOut0, amountOutUSD0, pair["token0"], pair["token1"],
                                borrowAddress0, exchangeA0, exchangeB0, exchangeC0
                            ))
                        }
                    } else {
                        if (exchangeA1 === undefined) {
                            return resolve(this.formatOutput(
                                extrema1, profit1, amountOut1, amountOutUSD1, pair["token1"], pair["token0"],
                                borrowAddress1, exchangeA1, exchangeB1, exchangeC1
                            ))
                        }
                    }
                }
            }

            resolve(0)
        })
    }

    async formatOutput(amountIn, profit, profitETH, profitUSD, token0, token1, borrowPair, exchangeA, exchangeB, exchangeC) {
        return {
            "amountIn": amountIn,
            "profit": profit,
            "profitETH": profitETH,
            "profitUSD": profitUSD,
            "token0": token0,
            "token1": token1,
            "borrowPair": borrowPair,
            "exchangeA": exchangeA,
            "exchangeB": exchangeB,
            "exchangeC": exchangeC,
        }
    }

    async getBorrowPair(token0, token0ID, token1, token1ID, amountNeeded) {
        return new Promise(async resolve => {
            let promises = []
            if (this.knownBorrowPairs[token0ID] !== undefined) {
                for (const borrowPair of this.knownBorrowPairs[token0ID]) {
                    if (borrowPair["otherTokenID"] !== token1ID) {
                        promises.push(new Promise(async resolve => {
                            resolve({
                                "reserve": (await this.exchanges[0].getReservesFromPair(borrowPair["address"], token0))["reserve0"],
                                "address": borrowPair["address"]
                            })
                        }))
                    }
                }
                const results = await Promise.all(promises)

                if (results.length > 0) {
                    const reserves = results.map(r => r["reserve"])
                    const maxReserve = getMax(reserves)
                    if (BigInt(maxReserve) > BigInt(amountNeeded))
                        return resolve([maxReserve, results[reserves.indexOf(maxReserve)]["address"]])
                }
            }

            const selectCommands = []
            for (const exchange of this.exchanges) {
                selectCommands.push(`
                    select address, token0, token1 from ${exchange.tableName} where (
                        (token0 = '${token0ID}' and token1 != '${token1ID}') or
                        (token1 = '${token0ID}' and token0 != '${token1ID}')
                    )
                `)
            }

            const validPairs = await this.database.custom(selectCommands.join(" union "))

            if (validPairs.length > 5000)
                console.log("borrowPairs exceeded 5k", token0, token0ID, token1, token1ID, amountNeeded)
            const results = await doAsync(validPairs, async (item) => {
                return {
                    "reserve": (await this.exchanges[0].getReservesFromPair(item["address"], token0))["reserve0"],
                    "otherTokenID": item["token0"] === token0ID ? item["token1"] : item["token0"],
                    "address": item["address"]
                }
            }, 500)

            if (results.length > 0) {
                const reserves = results.map(r => r["reserve"])
                const maxReserve = getMax(reserves)
                const bestPair = results[reserves.indexOf(maxReserve)]

                const borrowPairData = {
                    "otherTokenID": bestPair["otherTokenID"],
                    "address": bestPair["address"]
                }

                if (this.knownBorrowPairs[token0ID] === undefined)
                    this.knownBorrowPairs[token0ID] = [borrowPairData]
                else if (!this.knownBorrowPairs[token0ID].map(p => p["address"]).includes(borrowPairData["address"]))
                    this.knownBorrowPairs[token0ID].push(borrowPairData)

                // @formatter:off
                this.fs.writeFile(this.knownBorrowPairsFilePath, JSON.stringify(this.knownBorrowPairs, null, 3), () => {})
                // @formatter:on

                if (BigInt(maxReserve) > BigInt(amountNeeded))
                    return resolve([maxReserve, bestPair["address"]])
            }
            return resolve([0, undefined])
        })
    }

    async getBestInput(exchangeData, reversed = false, maxExtrema = undefined) {
        let bestInput = 0, profit = 0, exchangeA = undefined, exchangeB = undefined
        for (let i = 0; i < exchangeData.length; i++) {
            for (let j = 0; j < exchangeData.length; j++) {
                if (i === j) continue

                const params = [
                    exchangeData[i]["reserve" + (reversed ? "1" : "0")],
                    exchangeData[i]["reserve" + (reversed ? "0" : "1")],
                    exchangeData[i]["swapFee"],
                    exchangeData[j]["reserve" + (reversed ? "1" : "0")],
                    exchangeData[j]["reserve" + (reversed ? "0" : "1")],
                    exchangeData[j]["swapFee"],
                ]
                const tempExtrema = this.calculator.calculateSimpleExtrema(...params)
                if (!isNaN(tempExtrema) && BigInt(tempExtrema) > 0) {
                    const extrema = maxExtrema === undefined ? tempExtrema : (BigInt(maxExtrema) > BigInt(tempExtrema) ? tempExtrema : maxExtrema)
                    const tempProfit = this.calculator.calculateProfit(extrema, ...params)
                    if (BigInt(tempProfit) > BigInt(profit)) {
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
                    "amountOut": await exchange.swapToWETH(amountIn, token),
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
