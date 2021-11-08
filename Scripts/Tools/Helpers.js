const fs = require("fs")

module.exports = {
    getMax: array => {
        if (array.length > 0) {
            let max = array[0]
            for (let i = 1; i < array.length; i++) {
                if (BigInt(array[i]) > BigInt(max))
                    max = array[i]
            }
            return max
        }
        return undefined
    },
    getMin: array => {
        if (array.length > 0) {
            let min = array[0]
            for (let i = 1; i < array.length; i++) {
                if (BigInt(array[i]) < BigInt(min))
                    min = array[i]
            }
            return min
        }
        return undefined
    },
    doAsync: async (array, handle, parallel) => {
        if (parallel !== undefined) {
            let results = []
            let countDone = 0
            while (countDone < array.length) {
                let promises = []
                for (let i = 0; i < Math.min(parallel, array.length - countDone); i++) {
                    promises.push(handle(array[countDone + i]))
                }
                results.push(...(await Promise.all(promises)))
                countDone += parallel
            }
            return results
        } else {
            let promises = []
            for (const item of array) {
                promises.push(handle(item))
            }
            return Promise.all(promises)
        }
    },
    getExchangeAddress: (exchanges, exchangeName) => {
        const tempMapped = exchanges.map(e => e.tableName)
        return exchanges[tempMapped.indexOf(exchangeName)].routerAddress
    },
    saveJson: (fileName, data) => {
        fs.writeFileSync(fileName, JSON.stringify(data, null, 3))
    },
    printHeadline: text => {
        console.log(`\x1b[32m${text}\x1b[0m`)
    }
}