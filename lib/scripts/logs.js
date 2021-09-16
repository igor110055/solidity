const Web3 = require("web3")
const web3 = new Web3("ws://127.0.0.1:8545")

const contractName = "TestSwapContract"
const contractFile = require("../../box/build/contracts/" + contractName + ".json")
const contractABI = contractFile["abi"]
const contractAddress = contractFile["networks"]["56"]["address"]

const privateKey = "0x02a69968be40fd71f967af96cab13a77908c0d501c47578d7539508a800ef408"
const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address
web3.eth.accounts.wallet.add(privateKey)

async function main() {
    const ownContract = new web3.eth.Contract(contractABI, contractAddress)

    ownContract.once('Log', function(error, event){
        console.log(event, error);
    })

    ownContract.methods.set(500).send({
        from: walletAddress,
        gas: Web3.utils.toHex("500000"),
        gasPrice: Web3.utils.toHex(Web3.utils.toWei("22", "gwei"))
    }).then(() => {
        ownContract.methods.get().call().then(result => {
            console.log(result)
        })
    })
}

main()
