from web3 import Web3
from web3.middleware import geth_poa_middleware
import schedule
import time
import json


w3 = Web3(Web3.HTTPProvider("https://bsc-dataseed.binance.org/"))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)
latestCheckedBlock = 0
jsonData = json.load(open("data.json"))

routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
routerContract = w3.eth.contract(address=routerAddress, abi=json.load(open("./Pancake/ABIs/pancakeRouterABI.json")))


def fetch():
    global latestCheckedBlock
    currentBlockNumber = w3.eth.get_block_number()
    if currentBlockNumber > latestCheckedBlock:
        latestCheckedBlock = currentBlockNumber
        checkBlock(currentBlockNumber)


def checkBlock(blockNumber):
    block = w3.eth.getBlock(blockNumber, True)
    print("Checking Block: " + str(block["number"]))
    for transaction in block["transactions"]:
        if transaction["to"] == routerAddress:
            data = transaction["input"]
            decoded = routerContract.decode_function_input(data)
            if "swap" in str(decoded[0]):
                path = decoded[1]["path"]
                handlePath(path)

    json.dump(jsonData, open("data.json", "w"), indent=3)


def handlePath(path):
    if len(path) >= 2:
        sold = path[0]
        bought = path[-1]
    else:
        return

    if len(path) >= 3:
        between = path[1:-1]
    else:
        between = []

    if sold not in jsonData.keys():
        jsonData[sold] = {
            "from": 1,
            "over": 0,
            "to": 0
        }
    else:
        jsonData[sold]["from"] = jsonData[sold]["from"] + 1

    if bought not in jsonData.keys():
        jsonData[bought] = {
            "from": 0,
            "over": 0,
            "to": 1
        }
    else:
        jsonData[bought]["to"] = jsonData[bought]["to"] + 1

    for token in between:
        if token not in jsonData.keys():
            jsonData[token] = {
                "from": 0,
                "over": 1,
                "to": 0
            }
        else:
            jsonData[token]["over"] = jsonData[token]["over"] + 1


fetch()
schedule.every(2).seconds.do(fetch)

while 1:
    schedule.run_pending()
    time.sleep(1)
