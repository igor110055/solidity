const {getMax, doAsync} = require("../Tools/Helpers")

module.exports = class PairFetcher {
    constructor(database) {
        this.database = database

        this.interval = 5000
        this.parallelLimit = 1
        this.minWETHBalance = 0.5
        this.showStatus = true

        this.exchanges = []
        this.exchangeData = {}
        for (let i = 1; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])
            this.exchangeData[arguments[i].tableName] = {}
        }

        this.alreadyFetching = false
        const ticker = async () => {
            if (!this.alreadyFetching) {
                this.alreadyFetching = true
                await doAsync(this.exchanges, e => this.updateDatabase(e))

                if (this.showStatus)
                    await this.printStatus()

                this.alreadyFetching = false
            }
        }

        ticker().then()
        setInterval(ticker, this.interval)
    }

    async fetchPairs(exchange) {
        const missingPairs = await this.database.select(exchange.tableName, "number", "where address is null" +
            (this.parallelLimit > 0 ? ` limit ${this.parallelLimit}` : "")
        )

        if (missingPairs.length > 0) {
            let results = await doAsync(missingPairs, p => exchange.getPairUsingNumber(p["number"] - 1))

            console.log("a")
            await doAsync(results, async r => {
                const amountsWETHForToken0 = await doAsync(this.exchanges, async exchange => {
                    return await exchange.swapToWETH(r["token0"], r["reserve0"])
                })

                const amountsWETHForToken1 = await doAsync(this.exchanges, async exchange => {
                    return await exchange.swapToWETH(r["token1"], r["reserve1"])
                })

                r["totalWETH"] = (getMax(amountsWETHForToken0) + getMax(amountsWETHForToken1)) / 1E18
            })
            console.log(r)
            results = results.filter(r => r["totalWETH"] >= this.minWETHBalance)

            const allTokens = new Set(results.map(r => r["token0"]).concat(results.map(r => r["token1"])))

            const commands = Array(...allTokens).map(t => `
                select '${t}' from dual where not exists (select * from Tokens where tokenAddress='${t}')
            `)
            await this.database.custom("insert into Tokens (tokenAddress) " + commands.join(" union "))

            for (let i = 0; i < results.length; i++) {
                results[i]["number"] += 1
                results[i]["token0"] = `(select tokenID from Tokens where tokenAddress = '${results[i]["token0"]}' limit 1)`
                results[i]["token1"] = `(select tokenID from Tokens where tokenAddress = '${results[i]["token1"]}' limit 1)`
            }

            await this.database.updateMultiple(
                exchange.tableName,
                Object.keys(results[0]),
                results.filter(r => r["totalWETH"] >= this.minWETHBalance),
                "number"
            )
        }
    }

    async updateDatabase(exchange) {
        const allKnownPairs = (await this.database.select(exchange.tableName, "count(*) as n"))[0]["n"]
        const totalPairs = await exchange.getTotalPairs()

        this.exchangeData[exchange.tableName] = {
            "total": totalPairs,
            "known": allKnownPairs
        }
        console.log(`${exchange.tableName}: ${allKnownPairs}/${totalPairs}`)
        if (totalPairs > allKnownPairs) {
            const required = totalPairs - allKnownPairs
            const number = required <= this.parallelLimit ? required : this.parallelLimit
            console.log("a")
            await this.database.insertMultiple(exchange.tableName, undefined, undefined, number)
            console.log("b")
            await this.fetchPairs(exchange)
        }
    }

    async printStatus() {
        console.log()
        let finishedExchanges = []
        let waitingFor = []
        for (const exchangeName of Object.keys(this.exchangeData)) {
            const data = this.exchangeData[exchangeName]
            if (data["known"] < data["total"]) {
                waitingFor.push(exchangeName)
            } else {
                finishedExchanges.push(exchangeName)
            }
        }
        if (finishedExchanges.length > 0) {
            console.log(`Finished exchanges: ${finishedExchanges.join(", ")}`)
        }
        if (waitingFor.length > 0) {
            console.log("Waiting for: ")
            for (const exchangeName of waitingFor) {
                console.log(`${exchangeName}: ${data["known"]}/${data["total"]} ` +
                    `\x1b[31m(${(data["known"] / data["total"] * 100).toFixed(3)}%)\x1b[0m`
                )
            }
        }
    }
}