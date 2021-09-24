module.exports = class Database {
    constructor() {
        this.fs = require("fs")
        this.config = JSON.parse(this.fs.readFileSync("./config.json").toString())
        this.saveConfig = () => this.fs.writeFileSync("./config.json", JSON.stringify(this.config, null, 3))

        this.sqlite3 = require("sqlite3")
        this.db = new this.sqlite3.Database(this.config["databaseDirectory"])

        if (this.config["runSetup"]) {
            this.config["runSetup"] = false
            this._createTables()
            this.saveConfig()
        }
    }

    _createTables() {
        for (const table in this.config["tables"]) {
            let columns = []
            for (const column in this.config["tables"][table])
                columns.push(`${column} ${this.config["tables"][table][column]}`)

            // @formatter:off
            this.db.run(`create table ${table} (${columns.join(", ")})`)
            // @formatter:on
        }
    }

    saveData(table, jsonData) {
        let values = []
        for (const columnValue in jsonData)
            values.push(`"${jsonData[columnValue]}"`)

        // @formatter:off
        let insertCommand = `insert into ${table} (${Object.keys(jsonData).join(", ")}) values (${values.join(", ")})`
        // @formatter:on

        this.db.run(insertCommand)
    }

    async getData(table, condition = "") {
        return new Promise((resolve => {
            // @formatter:off
            this.db.all(`select * from ${table} ${condition}`, (err, res) => {
            // @formatter:on
                resolve(res)
            })
        }))
    }
}
