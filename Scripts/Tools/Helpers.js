const fs = require("fs")
const Web3 = require("web3")
const Axios = require("axios");

module.exports = {
    // This function is required because Math.max() doesn't work with BigNumbers
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
    // This function is required because Math.min() doesn't work with BigNumbers
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
    // Simple function to do tasks in packets of a certain size at a time
    doAsync: async (array, handle, parallel) => {
        return new Promise(async resolve => {
            if (parallel !== undefined) {
                let results = []
                let countDone = 0
                while (countDone < array.length) {
                    let promises = []
                    for (let i = 0; i < Math.min(parallel, array.length - countDone); i++) {
                        promises.push(handle(array[countDone + i]))
                    }
                    results.push(...(await Promise.all(promises).catch()))
                    countDone += parallel
                }
                resolve(results)
            } else {
                let promises = []
                for (const item of array) {
                    promises.push(handle(item))
                }
                Promise.all(promises).then(resolve).catch(() => resolve([]))
            }
        })
    },
    // Retrieves the address using the tableName of the exchange
    getExchangeAddress: (exchanges, exchangeName) => {
        const tempMapped = exchanges.map(e => e.tableName)
        return exchanges[tempMapped.indexOf(exchangeName)].routerAddress
    },
    saveJson: (fileName, data) => {
        fs.writeFileSync(fileName, JSON.stringify(data, null, 3))
    },
    printHeadline: (text, color) => {
        if (color === undefined)
            console.log(`\x1b[32m${text}\x1b[0m`)
        else if (color === "orange")
            console.log(`\x1b[33m${text}\x1b[0m`)
    },
    weightedRandom: values => {
        let sum = 0
        for (let i = 0; i < values.length; i++) {
            sum += values[i]
        }
        let random = Math.floor(Math.random() * sum)
        let current = 0
        for (let i = 0; i < values.length; i++) {
            current += values[i]
            if (random < current) {
                return i
            }
        }
        return values.length - 1
    },
}

// Different web3 websocket providers and their corresponding weight in order to distribute requests based on their rate limit
let web3Config = [
    [3500, "wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/ws"],
    // [1200, "wss://apis.ankr.com/wss/b1e0d936c6a84a7aa9f5caed17d44382/12b092c37506f14f5e16347e077f85b6/binance/full/main"],
    // [2000, "wss://bsc-ws-node.nariox.org:443"],
    // [1000, "wss://bsc.getblock.io/mainnet/?api_key=5fe8e9c8-e755-48f1-a4cb-80f3406cbc3c"] // Limited balance
]

let web3Objects = web3Config.map(config => {
    console.log(`\x1b[32mConnected to\x1b[0m ${config[1]}`)
    return new Web3(new Web3.providers.WebsocketProvider(config[1], {
        clientConfig: {
            maxReceivedFrameSize: 100000000,
            maxReceivedMessageSize: 100000000,
            // keepalive: true,
            // keepaliveInterval: 60000
        },
        // reconnect: {
        //     auto: true,
        //     delay: 5000,
        //     maxAttempts: 999999,
        //     onTimeout: true
        // }
    }))
})

let weights = web3Config.map(config => config[0])

module.exports = {
    ...module.exports,
    get web3() {
        return web3Objects[module.exports.weightedRandom(weights)]
    }
}

let bnbPrice = undefined

module.exports = {
    ...module.exports,
    async fetchBNBPrice(){
        return new Promise(async resolve => {
            let response = await Axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT")
            bnbPrice = parseFloat(response.data.price)
            console.log(`\x1b[32mFetched BNB Price (${bnbPrice.toFixed(2)})\x1b[0m`)
            resolve()
        })
    },
    getBNBPrice(){
        return bnbPrice
    }
}