const fs = require("fs")

/*
How to use this config:
 #1 Use a directory as the key (needs to have allKnownPairs.json inside)
 #2 Specify filters:
    Allowed filters are: bought, routed, sold, total
    The address passes if one of the filters is valid (transactions counted >= value specified in filter)
 */
const config = {
    "Biswap": {
        "total": 5
    },
    "Pancake": {
        "total": 10
    }
}

console.time("Filtering took")
for (const directory in config) {
    const allPairs = JSON.parse(fs.readFileSync(`./${directory}/allKnownPairs.json`).toString())
    const filteredPairs = []
    for (const pairAddress in allPairs) {
        const infos = {
            sold: allPairs[pairAddress].sold,
            routed: allPairs[pairAddress].routed,
            bought: allPairs[pairAddress].bought,
            total: allPairs[pairAddress].sold + allPairs[pairAddress].routed + allPairs[pairAddress].bought
        }

        for (const filter in config[directory]) {
            if (Object.keys(infos).includes(filter)){
                if (infos[filter] >= config[directory][filter]){
                    filteredPairs.push(pairAddress)
                    break // Break because the address should only get added once (even if it passes multiple filters)
                }
            }
        }
    }
    fs.writeFile(`./${directory}/filteredPairs.json`, JSON.stringify(filteredPairs, null, 3), err => {
        if (err)
            console.log(err)
    })
}
console.timeEnd("Filtering took")