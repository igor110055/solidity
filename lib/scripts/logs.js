const Web3 = require("web3")
const web3 = new Web3("http://127.0.0.1:8545")

web3.eth.accounts.wallet.add("3fc67234ad6325fe34e838c462d0783d549d016a38034f7299aec2047a4159f2")

const contractName = "TestSwapContract"

const contractFile = require("../../box/build/contracts/" + contractName + ".json")
const contractABI = contractFile["abi"]
const contractAddress = contractFile["networks"]["56"]["address"]
console.log(contractAddress)

async function main(){
    const contract = new web3.eth.Contract(contractABI, contractAddress)
    // contract.once('Log', function(error, event){
    //     console.log(event);
    // })


    // console.log("Function call")
    // contract.methods.swap("test123").call()

    contract.methods.set(21).send({
        from: "0x5a67e50c7Cd0E79D8008A67e572C6Cc9e816432d",
        gas: Web3.utils.toHex("500000"),
        gasPrice: Web3.utils.toHex(Web3.utils.toWei("22", "gwei"))
    }).then(() => {
        contract.methods.get().call().then(result => {
            console.log(result)
        })
    })
}

main()
