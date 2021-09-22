const abiDecoder = require('abi-decoder');
const Web3 = require("web3")
const fs = require("fs")
const web3 = new Web3("wss://bsc-ws-node.nariox.org:443")
let latestCheckedBlock = 0

const config = {
    "0x10ED43C718714eb63d5aA57B78B54704E256024E": "Pancake",
    "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8": "Biswap"
}

const functionFilters = ["swap"]

let knownPairs = {}
let knownPairFiles = {}

const contractAddresses = Object.keys(config)
contractAddresses.forEach(address => {
    const folderName = config[address]

    knownPairFiles[address] = `./${folderName}/allKnownPairs.json`
    let pairs;
    try {
        pairs = JSON.parse(fs.readFileSync(`./${folderName}/allKnownPairs.json`).toString())
    } catch {
        pairs = {}
    }
    const routerABI = JSON.parse(fs.readFileSync(`./${folderName}/ABIs/Router.json`).toString())
    abiDecoder.addABI(routerABI)

    knownPairs[address] = pairs
})


async function fetch() {
    let currentBlockNumber = await web3.eth.getBlockNumber()
    if (currentBlockNumber > latestCheckedBlock) {
        console.time(`Finished block ${currentBlockNumber}`)
        checkBlock(currentBlockNumber).then(() => {
            console.timeEnd(`Finished block ${currentBlockNumber}`)
            savePairs()
        })
        latestCheckedBlock = currentBlockNumber
    }
}

async function checkBlock(number) {
    const block = await web3.eth.getBlock(number, true)
    for (const transaction of block.transactions) {
        if (contractAddresses.includes(transaction.to)) {
            await handleTransaction(transaction)
        }
    }
}

async function handleTransaction(transaction) {
    const decodedData = abiDecoder.decodeMethod(transaction.input)
    for (const filter of functionFilters) {
        if (decodedData.name.includes(filter)) {
            for (const parameter of decodedData.params) {
                if (parameter.name === "path") {
                    await handlePath(transaction.to, parameter.value)
                    break
                }
            }
        }
    }
}

async function handlePath(contractAddress, path) {
    if (path.length < 2)
        return

    await helper(contractAddress, path[0], "sold")
    await helper(contractAddress, path[path.length - 1], "bought")

    if (path.length > 2) {
        for (let i = 1; i < path.length - 1; i++) {
            await helper(contractAddress, path[i], "routed")
        }
    }

}

async function helper(contractAddress, tokenAddress, type) {
    if (!Object.keys(knownPairs[contractAddress]).includes(tokenAddress)) {
        knownPairs[contractAddress][tokenAddress] = {"sold": 0, "routed": 0, "bought": 0}
        knownPairs[contractAddress][tokenAddress][type] = 1
    } else {
        knownPairs[contractAddress][tokenAddress][type] += 1
    }
}

async function savePairs() {
    for (const address in knownPairFiles) {
        const filePath = knownPairFiles[address]
        await fs.writeFile(filePath, JSON.stringify(knownPairs[address], null, 3), err => {
            if (err)
                console.log(err)
        })
    }
}

// fs.writeFile("./Pancake/allKnownPairs.json", JSON.stringify(["help": "something"], null, 3), () => {})
setInterval(fetch, 1000)
