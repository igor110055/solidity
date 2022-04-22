const {doAsync, printHeadline} = require("../Tools/Helpers")

module.exports = class PairFetcher {
    constructor(database) {
        this.database = database

        this.interval = 5000
        this.parallelFetchLimit = 100
        this.parallelInsertLimit = this.parallelFetchLimit
        this.showStatus = true

        this.exchanges = []
        this.exchangeData = {}
        for (let i = 1; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])
            this.exchangeData[arguments[i].tableName] = {}
        }

        this.alreadyFetching = false
    }

    async start() {
        const ticker = async () => {
            if (!this.alreadyFetching) {
                this.alreadyFetching = true
                await doAsync(this.exchanges, e => this.updateDatabase(e))

                if (this.showStatus)
                    await this.printStatus()

                this.alreadyFetching = false
            }
        }

        this.intervalID = setInterval(ticker, this.interval)
        ticker().then()
    }

    async stop() {
        clearInterval(this.intervalID)
    }

    async fetchPairs(exchange) {
        const missingPairs = await this.database.select(exchange.tableName, "number",
            `where address is null and number <= ${this.exchangeData[exchange.tableName]["total"]} 
            ${this.parallelFetchLimit > 0 ? ` limit ${this.parallelFetchLimit}` : ""}`
        )

        if (missingPairs.length > 0) {
            let results = await doAsync(missingPairs, p => exchange.getPairUsingNumber(p["number"] - 1))
            if (results.length === 0)
                return

            const allTokens = new Set(results.map(r => r["token0"]).concat(results.map(r => r["token1"])))

            const commands = Array(...allTokens).map(t => `
                select '${t}' from dual where not exists (select * from Tokens where tokenAddress='${t}')
            `)
            await this.database.custom("insert into Tokens (tokenAddress) " + commands.join(" union "))

            results = results.map(r => {
                r["number"] += 1
                r["token0"] = `(select tokenID from Tokens where tokenAddress = '${r["token0"]}' limit 1)`
                r["token1"] = `(select tokenID from Tokens where tokenAddress = '${r["token1"]}' limit 1)`
                return r
            })

            await this.database.updateMultiple(exchange.tableName, Object.keys(results[0]), results, "number")
        }
    }

    async updateDatabase(exchange) {
        const allKnownPairs = (await this.database.select(exchange.tableName, "count(*) as n"))[0]["n"]
        const totalPairs = await exchange.getTotalPairs()

        this.exchangeData[exchange.tableName] = {
            "total": totalPairs,
            "known": allKnownPairs
        }

        if (totalPairs > allKnownPairs) {
            const required = totalPairs - allKnownPairs
            const number = required <= this.parallelInsertLimit ? required : this.parallelInsertLimit

            let values = []
            for (let i = 0; i < number; i++)
                values.push("()")
            await this.database.custom(`
                insert into ${exchange.tableName} () values ${values.join(",")}
            `)

            await this.fetchPairs(exchange)
        }
    }

    async printStatus() {
        console.log()

        let finishedExchanges = []
        let waitingFor = []
        for (const exchange in this.exchangeData) {
            if (this.exchangeData[exchange]["total"] <= this.exchangeData[exchange]["known"])
                finishedExchanges.push(exchange)
            else
                waitingFor.push(exchange)
        }

        printHeadline("Fetching")
        if (finishedExchanges.length > 0) {
            printHeadline("\tFinished:")
            console.log(`\t${finishedExchanges.join(", ")}`)
        }
        if (waitingFor.length > 0) {
            printHeadline("\tWaiting for:", "orange")
            for (const exchangeName of waitingFor) {
                const known = this.exchangeData[exchangeName]["known"]
                const total = this.exchangeData[exchangeName]["total"]
                console.log(`\t${exchangeName}: ${known}/${total} ` +
                    `\x1b[31m(${(known / total * 100).toFixed(3)}%)\x1b[0m`
                )
            }
        }
    }
}