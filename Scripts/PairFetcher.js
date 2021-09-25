module.exports = class PairFetcher {
    constructor(database) {
        this.database = database

        this.interval = 60000
        this.exchanges = []
        for (let i = 1; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])
        }

        const ticker = () => {
            for (const exchange of this.exchanges) {
                this.updateDatabase(exchange[0], exchange[1]).then()
            }
        }
        ticker()
        setInterval(ticker, this.interval)
    }

    async fetchPairs(exchange, pairTable) {
        const totalMissingPairs = (await this.database.getData(pairTable, "count(*) as n", "where address is null"))[0]["n"]

        if (totalMissingPairs > 0) {
            const pairsFetching = await this.database.getData(pairTable, "number", `where address is null`)
            for (const missingPair of pairsFetching) {
                const pairNumber = missingPair["number"] - 1
                exchange.getPair(pairNumber).then((result, error) => {
                    if (error)
                        console.log(`Could not fetch pair: ${pairNumber} in table: ${pairTable} because of: ${error}`)
                    else
                        this.database.updateData(pairTable, {"number": pairNumber + 1}, result)
                })
            }
        }
    }

    async updateDatabase(exchange, pairTable) {
        const allKnownPairs = (await this.database.getData(pairTable, "count(*) as n"))[0]["n"]
        const totalPairs = await exchange.getTotalPairs()

        if (totalPairs > allKnownPairs) {
            for (let i = 0; i < totalPairs - allKnownPairs; i++)
                this.database.saveData(pairTable)

            console.log(`Created ${totalPairs - allKnownPairs} value(s) in table ${pairTable}`)
            await this.fetchPairs(exchange, pairTable)
        }
    }
}