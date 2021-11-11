const fs = require("fs")
const Web3 = require("web3")

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
                results.push(...(await Promise.all(promises).catch()))
                countDone += parallel
            }
            return results
        } else {
            let promises = []
            for (const item of array) {
                promises.push(handle(item))
            }
            return Promise.all(promises).catch()
        }
    },
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

let web3Config = [
    [3000, "wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/ws"],
    [1200, "wss://apis.ankr.com/wss/b1e0d936c6a84a7aa9f5caed17d44382/12b092c37506f14f5e16347e077f85b6/binance/full/main"],
    [2000, "wss://bsc-ws-node.nariox.org:443"]
]

let web3Objects = web3Config.map(config => {
    return new Web3(new Web3(new Web3.providers.WebsocketProvider(
        config[1],
        {
            clientConfig: {
                maxReceivedFrameSize: 100000000,
                maxReceivedMessageSize: 100000000,
                keepalive: true,
                keepaliveInterval: 60000
            },
            reconnect: {
                auto: true,
                delay: 5000,
                maxAttempts: 999999,
                onTimeout: true
            }
        }
    )))
})

let weights = web3Config.map(config => config[0])

module.exports = {
    ...module.exports,
    get web3() {
        return web3Objects[module.exports.weightedRandom(weights)]
    }
}

const apiKeys = [
    "1IUXSGR2HAZPX7E39JK9SB39D2YWU1VN15",
    "Z9HBC7D8V9B26FRGSESSBE9H7MXXXE8TJ2",
]

const proxies = [
    {
        host: "209.127.191.180",
        port: "9279",
        username: "pmutzxuf",
        password: "euhj5w46krdq"
    },
    {
        host: "45.95.99.20",
        port: "7580",
        username: "pmutzxuf",
        password: "euhj5w46krdq"
    },
    {
        host: "45.95.96.132",
        port: "8691",
        username: "pmutzxuf",
        password: "euhj5w46krdq"
    },
    {
        host: "45.95.96.237",
        port: "8796",
        username: "pmutzxuf",
        password: "euhj5w46krdq"
    },
    {
        host: "193.8.56.119",
        port: "9183",
        username: "pmutzxuf",
        password: "euhj5w46krdq"
    }
]
const Axios = require("axios")

module.exports.getTransactionCount = async (address, limit = 100) => {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)]
    const result = await Axios.get(`
        https://api.bscscan.com/api
        ?module=account
        &action=tokentx
        &contractaddress=${address}
        &page=1
        &offset=${limit}
        &apikey=${apiKeys[0]}
    `.replace(/\s/g, ""), {
        proxy: {
            host: proxy.host,
            port: proxy.port,
            auth: {
                username: proxy.username,
                password: proxy.password
            }
        }
    })
    return result.data.result.length
}