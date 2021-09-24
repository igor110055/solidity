//const sqlite = require("sqlite3").verbose()
//const db = new sqlite.Database("./database.db")

// db.run("create table pairs (type text, hash text, token0 text, token1 text)")

//const fs = require("fs")
//const data = JSON.parse(fs.readFileSync("./Pancake/allKnownPairs.json").toString())
//
//for (const token in data) {
//    db.run(`insert into pairs (hash, token0, token1) values ("${token}", "${token[2]}", "${token[3]}")`)
//}

//console.time("This is fast")
//db.all("select hash from pairs where token0='e'", (err, row) => {
//    if (err)
//        console.log(err)
//    else {
//        console.log(row)
//        console.timeEnd("This is fast")
//    }
//})

class Database{
    constructor() {
        this.fs = require("fs")
        this.config = JSON.parse(this.fs.readFileSync("./config.json").toString())
        this.saveConfig = () => this.fs.writeFileSync("./config.json", JSON.stringify(this.config, null, 3))

        if(this.config["runSetup"]){
            this.config["runSetup"] = false
            this.saveConfig()
        }
    }
}
const test = new Database()