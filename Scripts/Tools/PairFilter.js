const {doAsync, printHeadline} = require("../Tools/Helpers");

module.exports = class PairFilter {
    constructor(database) {
        this.database = database

        this.interval = 5000
        this.parallelTokens = 250
        this.parallelPairs = 10
        this.showStatus = true
        this.minWETHInPair = 1

        this.exchanges = []
        this.tokenValues = {}

        for (let i = 1; i < arguments.length; i++) {
            if (arguments[i].tableName === "PancakeV2Pairs")
                this.sellAt = arguments[i]

            this.exchanges.push(arguments[i])
        }
        this.alreadyFiltering = false
    }

    async setup() {
        const results = await this.database.select("Tokens", "*", "where inWETH is not null")
        results.forEach(token => {
            this.tokenValues[token["tokenAddress"]] = token["inWETH"]
        })
    }

    async start() {
        const ticker = async () => {
            if (!this.alreadyFiltering) {
                this.alreadyFiltering = true
                await this.updateTokens()
                await doAsync(this.exchanges, e => this.updateExchange(e))

                if (this.showStatus)
                    await this.printStatus()

                this.alreadyFiltering = false
            }
        }

        ticker().then()
        setInterval(ticker, this.interval)
    }

    async updateTokens() {
        const tokensWithoutValue = await this.database.select("Tokens", "*", `where inWETH is null limit ${this.parallelTokens}`)
        if (tokensWithoutValue.length > 0) {
            const results = await doAsync(tokensWithoutValue, async token => {
                token["inWETH"] = await this.sellAt.swapToWETH(1E18, token["tokenAddress"])
                this.tokenValues[token["tokenAddress"]] = token["inWETH"]
                return token
            })

            await this.database.updateMultiple("Tokens", Object.keys(results[0]), results, "tokenID")
        }
    }

    async updateExchange(exchange) {
        const missingPairs = await this.database.custom(`
            select
                   ex.number as number, ex.address,
                   t1.tokenAddress as "token0",
                   t2.tokenAddress as "token1",
                   ex.totalWETH, ex.useful
            from ${exchange.tableName} as ex
                inner join Tokens as t1 on t1.tokenID = ex.token0
                inner join Tokens as t2 on t2.tokenID = ex.token1
            where totalWETH is null
            limit ${this.parallelPairs}
        `)

        const knownTokens = Object.keys(this.tokenValues)
        if (missingPairs.length > 0) {
            let results = await doAsync(missingPairs.filter(
                pair => knownTokens.includes(pair["token0"]) && knownTokens.includes(pair["token1"])
            ), async pair => {
                await exchange.getReservesFromPair(pair["address"], pair["token0"]).then(data => {
                    const {reserve0, reserve1} = data
                    pair["totalWETH"] = this.tokenValues[pair["token0"]] * reserve0 / 1E18 + this.tokenValues[pair["token1"]] * reserve1 / 1E18
                    return {
                        "number": pair["number"],
                        "totalWETH": this.tokenValues[pair["token0"]] * reserve0 / 1E18 + this.tokenValues[pair["token1"]] * reserve1 / 1E18,
                        "useful": pair["totalWETH"] >= this.minWETHInPair * 1E18
                    }
                }).catch()
            })
            results = results.filter(r => r !== undefined)
            if (results.length > 0)
                await this.database.updateMultiple(exchange.tableName, Object.keys(results[0]), results, "number")
        }
    }


    async printStatus() {
        console.log()
        const missingTokens = (await this.database.select("Tokens", "count(*) as c", "where inWETH is null"))[0]["c"]
        const finishedTokens = (await this.database.select("Tokens", "count(*) as c", "where inWETH is not null"))[0]["c"]

        let finishedExchanges = []
        let waitingFor = []
        let filterData = {}
        for (const exchange of this.exchanges) {
            const total = (await this.database.select(exchange.tableName, "count(*) as c"))[0]["c"]
            const filtered = (await this.database.select(exchange.tableName, "count(*) as c", "where totalWETH is not null"))[0]["c"]
            filterData[exchange.tableName] = {"total": total, "filtered": filtered}

            if (filtered < total) {
                waitingFor.push(exchange.tableName)
            } else {
                finishedExchanges.push(exchange.tableName)
            }
        }

        printHeadline("Filtering")
        console.log(`Tokens: ${finishedTokens}/${missingTokens + finishedTokens} ` +
            `\x1b[31m(${(finishedTokens / (missingTokens + finishedTokens) * 100).toFixed(3)}%)\x1b[0m`
        )

        if (finishedExchanges.length > 0) {
            console.log(`Finished exchanges: ${finishedExchanges.join(", ")}`)
        }
        if (waitingFor.length > 0) {
            console.log("Waiting for: ")
            for (const exchangeName of waitingFor) {
                const data = filterData[exchangeName]
                console.log(`${exchangeName}: ${data["filtered"]}/${data["total"]} ` +
                    `\x1b[31m(${(data["filtered"] / data["total"] * 100).toFixed(3)}%)\x1b[0m`
                )
            }
        }
    }
}