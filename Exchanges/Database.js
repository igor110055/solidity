const DataStore = require("nedb")
const db = new DataStore({
    filename: "./database.db",
    autoload: true
})

console.time("This takes too long")
db.find({sold: 100}, (err, results) => {
    console.log(results)
    console.timeEnd("This takes too long")
})