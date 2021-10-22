const Web3 = require("web3")
const web3 = new Web3("http://10.10.0.36:8545")
web3.eth.getBalance("0x923e59176f94D46F728f45b69dbc9024CBB7D670").then(r => {
    console.log(r)
})