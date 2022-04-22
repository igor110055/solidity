const Web3 = require("web3")
const Axios = require("axios");

let web3Config = [
    [3500, "wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/ws"],
    [1200, "wss://apis.ankr.com/wss/b1e0d936c6a84a7aa9f5caed17d44382/12b092c37506f14f5e16347e077f85b6/binance/full/main"],
    [2000, "wss://bsc-ws-node.nariox.org:443"],
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
let bnbPrice = undefined

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
    doAsync: async (array, handle, parallelCount) => {
        return new Promise(async resolve => {
            if (parallelCount !== undefined) {
                let results = []
                let countDone = 0
                while (countDone < array.length) {
                    let promises = []
                    for (let i = 0; i < Math.min(parallelCount, array.length - countDone); i++) {
                        promises.push(handle(array[countDone + i]))
                    }
                    results.push(...(await Promise.all(promises).catch()))
                    countDone += parallelCount
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
    getExchangeAddress: (exchanges, exchangeName) => {
        const tempMapped = exchanges.map(e => e.tableName)
        return exchanges[tempMapped.indexOf(exchangeName)].routerAddress
    },
    printHeadline: (text, color) => {
        if (color === "green")
            console.log(`\x1b[32m${text}\x1b[0m`)
        else if (color === "red")
            console.log(`\x1b[31m${text}\x1b[0m`)
        else if (color === "yellow")
            console.log(`\x1b[33m${text}\x1b[0m`)
        else
            console.log(text)
    },
    get web3() {
        const weightsSum = weights.reduce(function (sum, weight) {
            return sum + weight
        }, 0)
        let random = Math.floor(Math.random() * weightsSum)
        let current = 0
        for (let i = 0; i < weights.length; i++) {
            current += weights[i]
            if (random < current) {
                return web3Objects[i]
            }
        }
        return web3Objects[weights.length - 1]
    },
    async fetchBNBPrice() {
        return new Promise(async resolve => {
            let response = await Axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT")
            bnbPrice = parseFloat(response.data.price)
            module.exports.printHeadline(`BNB Price: ${bnbPrice}`, "green")
            resolve()
        })
    },
    getBNBPrice() {
        return bnbPrice
    }
}
