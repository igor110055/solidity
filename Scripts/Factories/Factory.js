const {getMax} = require("../Tools/Helpers");

module.exports = class Factory {
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

    async getBorrowPair(token0, token1, amountNeeded) {
        return new Promise(async resolve => {
            let promises = []

            for (const exchange of this.exchanges) {
                promises.push(new Promise(async resolve => {
                    let maxLoan = 0
                    let maxLoanPair = undefined

                    const validPairs = await this.database.select(exchange.tableName, "address", `
                        where
                            (token0 = '${token0}' and token1 != '${token1}') or
                            (token1 = '${token0}' and token0 != '${token1}')
                    `)

                    if (validPairs.length > 0) {
                        for (const validPair of validPairs) {
                            const reserve = await exchange.getReserveForToken(validPair["address"], token0)
                            if (reserve > amountNeeded) {
                                return resolve({
                                    "reserve": reserve,
                                    "pair": validPair["address"]
                                })
                            } else if (reserve > maxLoan) {
                                maxLoan = reserve
                                maxLoanPair = validPairs["address"]
                            }
                        }
                    }
                    return resolve({
                        "reserve": maxLoan,
                        "pair": maxLoanPair
                    })
                }))
            }
            const results = await Promise.all(promises)

            const reserves = results.map(r => r["reserve"])
            const maxReserve = getMax(reserves)
            return resolve({
                "reserve": maxReserve,
                "pair": results[reserves.indexOf(maxReserve)]["pair"]
            })
        })
    }
}