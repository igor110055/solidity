const Web3 = require("web3")
const web3 = new Web3("http://127.0.0.1:7545")

web3.eth.getBalance("0x923e59176f94D46F728f45b69dbc9024CBB7D670").then(balance => console.log(balance))

// web3.eth.getTransaction("0x236c84c016914bb2e65818edb3e662e8e5e7d9f6dbb0add214b21ebc1c38a839").then(result => {
//     console.log(result)
// })