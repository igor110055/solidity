const fs = require("fs")
const Web3 = require("web3");

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

let usedUp = 5
let web3Objects = [
    new Web3("wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/ws"),
    new Web3("wss://apis.ankr.com/wss/b1e0d936c6a84a7aa9f5caed17d44382/12b092c37506f14f5e16347e077f85b6/binance/full/main"),
    new Web3("wss://bsc-ws-node.nariox.org:443")
]
let capacities = [
    3000,
    1200,
    2000
]

capacities = capacities.map(c => c * 0.9)
let currentIndex = 0
module.exports = {
    ...module.exports,
    web3: () => {
        if (usedUp >= capacities[currentIndex]) {
            currentIndex = (currentIndex + 1) % web3Objects.length
            usedUp = 0
        }
        usedUp += 1
        return web3Objects[currentIndex]
    }
}