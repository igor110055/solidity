const Web3 = require("web3")
const web3 = new Web3("ws://127.0.0.1:8545")

const privateKey = "0x02a69968be40fd71f967af96cab13a77908c0d501c47578d7539508a800ef408"
const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address
web3.eth.accounts.wallet.add(privateKey)

const config = {
    pRouterAddress: "0x10ed43c718714eb63d5aa57b78b54704e256024e",
    pRouterABI: require("./files/pancakeRouterABI.json")
}

async function main() {
    const pRouterContract = new web3.eth.Contract(config.pRouterABI, config.pRouterAddress)

    pRouterContract.methods.swapExactETHForTokens(
        0,
        ["0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", "0x55d398326f99059ff775485246999027b3197955"],
        walletAddress,
        Math.floor(Date.now() / 1000) + 30
    ).send({
        from: walletAddress,
        gas: Web3.utils.toHex("1000000"),
        gasPrice: Web3.utils.toHex(Web3.utils.toWei("22", "gwei")),
        value: 1
    }).on("receipt", receipt => {
        console.log(receipt)
    }).catch(reason => {
        console.log(reason)
    })
}

main()
