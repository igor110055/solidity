const {doAsync, printHeadline, getTransactionCount} = require("../Tools/Helpers");

module.exports = class PairFilter {
    constructor(database) {
        this.database = database

        this.interval = 5000
        this.parallelPairs = 10
        this.showStatus = true
        this.minTransactionCount = 50

        this.exchanges = []
        this.filterData = {}

        for (let i = 1; i < arguments.length-10; i++) {
            this.exchanges.push(arguments[i])
            this.filterData[arguments[i].tableName] = {}
        }
        this.alreadyFiltering = false
    }

    async start() {
        for (const exchange of this.exchanges) {
            this.filterData[exchange.tableName] = {
                known: (await this.database.select(exchange.tableName, "count(*) as c", "where totalTransactions is not null"))[0]["c"],
                total: (await this.database.select(exchange.tableName, "count(*) as c"))[0]["c"]
            }
        }
        const ticker = async () => {
            if (!this.alreadyFiltering) {
                this.alreadyFiltering = true
                await doAsync(this.exchanges, e => this.updateExchange(e))

                if (this.showStatus)
                    await this.printStatus()

                this.alreadyFiltering = false
            }
        }

        ticker().then()
        setInterval(ticker, this.interval)
    }

    async updateExchange(exchange) {
        const missingPairs = await this.database.select(exchange.tableName, "*",
            `where totalTransactions is null limit ${this.parallelPairs}`)

        if (missingPairs.length > 0) {
            let results = await doAsync(missingPairs, async pair => {
                pair["totalTransactions"] = await getTransactionCount(pair["address"], this.minTransactionCount)
                pair["useful"] = pair["totalTransactions"] === this.minTransactionCount ? 1 : 0
                return pair
            })

            this.filterData[exchange.tableName]["known"] += results.length

            if (results.length > 0)
                await this.database.updateMultiple(exchange.tableName, Object.keys(results[0]), results, "number")
        }
    }


    async printStatus() {
        console.log()

        let finishedExchanges = []
        let waitingFor = []
        for (const exchange in this.filterData) {
            if (this.filterData[exchange]["total"] <= this.filterData[exchange]["known"])
                finishedExchanges.push(exchange)
            else
                waitingFor.push(exchange)
        }

        printHeadline("Filtering")
        if (finishedExchanges.length > 0) {
            printHeadline("\tFinished:")
            console.log(`\t${finishedExchanges.join(", ")}`)
        }
        if (waitingFor.length > 0) {
            printHeadline("\tWaiting for:", "orange")
            for (const exchangeName of waitingFor) {
                const known = this.filterData[exchangeName]["known"]
                const total = this.filterData[exchangeName]["total"]
                console.log(`\t${exchangeName}: ${known}/${total} ` +
                    `\x1b[31m(${(known / total * 100).toFixed(3)}%)\x1b[0m`
                )
            }
        }
    }
}