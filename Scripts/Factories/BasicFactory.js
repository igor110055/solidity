const Factory = require("./Factory")
const {getMax, getMin} = require("../Tools/Helpers");

module.exports = class BasicFactory extends Factory {
    constructor(database, calculator) {
        super();
        this.database = database
        this.calculator = calculator

        this.exchanges = []
        for (let i = 2; i < arguments.length; i++)
            this.exchanges.push(arguments[i])

        this.minProfitUSD = 0
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

                let params = [
                    exchangeData[exchangeAIndex]["reserve0"],
                    exchangeData[exchangeAIndex]["reserve1"],
                    exchangeData[exchangeAIndex]["swapFee"],
                    exchangeData[exchangeBIndex]["reserve0"],
                    exchangeData[exchangeBIndex]["reserve1"],
                    exchangeData[exchangeBIndex]["swapFee"]
                ]

                if(pair["token0"] === "0x0E52d24c87A5ca4F37E3eE5E16EF5913fb0cCEEB" || pair["token1"] === "0x0E52d24c87A5ca4F37E3eE5E16EF5913fb0cCEEB"){
                    console.log("yeet")
                }
                let extrema = this.calculator.calculateSimpleExtrema(...params)
                if (extrema > 0) {
                    let profitData = await this.getProfitData(extrema, params, pair["token0"])

                    if (profitData["profitETH"] / 1E18 * 350 > this.minProfitUSD) {
                        const borrowPairData = await this.getBorrowPair(pair["token0"], pair["token1"], extrema)
                        extrema = borrowPairData["reserve"] < extrema ? borrowPairData["reserve"] : extrema
                        profitData = await this.getProfitData(extrema, params, pair["token0"])

                        if (profitData["profitETH"] / 1E18 * 350 > this.minProfitUSD) {
                            return resolve({
                                "token0": pair["token0"],
                                "token1": pair["token1"],
                                "amountIn": extrema,
                                "borrowPair": borrowPairData["pair"],
                                "exchangeA": exchangesWithPair[exchangeAIndex],
                                "exchangeB": exchangesWithPair[exchangeBIndex],
                                "exchangeC": profitData["exchangeC"],
                                "profitETH": profitData["profitETH"]
                            })
                        } else {
                            console.log(profitData["profitETH"] / 1E18 * 350)
                        }
                    }
                }
            }
            return resolve({
                "profit": 0
            })
        })
    }

    async getBestTokens(limit = 1E6, offset = 0) {
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
                           ) as combined
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

    async getProfitData(extrema, params, token0) {
        let profit = this.calculator.calculateProfit(extrema, ...params)
        let profitAfterFee = Math.floor(profit - (extrema + (((extrema * 3) / 997) + 1)))

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
}
