module.exports = class PairFetcher{
    async fetch(exchange, database, pairTable){
        const allKnownPairs = await database.customCommand(`select number from ${pairTable}`)
        const totalPairs = await exchange.getTotalPairs()
        console.log(allKnownPairs, totalPairs)
    }

    async updateDatabase(exchange, database, pairTable){
        const allKnownPairs = (await database.customCommand(`select number from ${pairTable}`)).length
        const totalPairs = await exchange.getTotalPairs()
        
        if (totalPairs > allKnownPairs){
            for (let i = 0; i < totalPairs - allKnownPairs; i++) {
                // database.saveData(pairTable, {"token0": null})
            }
        }
    }
}