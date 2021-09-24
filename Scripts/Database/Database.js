module.exports = class Database {
    constructor() {
        this.fs = require("fs")
        this.config = JSON.parse(this.fs.readFileSync(__dirname + "/config.json").toString())
        this.saveConfig = () => this.fs.writeFileSync(__dirname + "/config.json", JSON.stringify(this.config, null, 3))

        this.sqlite3 = require("sqlite3")
        this.db = new this.sqlite3.Database(__dirname + this.config["databaseDirectory"])

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
        let insertCommand;
        let values = []
        for (const columnValue in jsonData)
            values.push(`"${jsonData[columnValue]}"`)

        // @formatter:off
        insertCommand = `insert into ${table} (${Object.keys(jsonData).join(", ")}) values (${values.join(", ")})`
        // @formatter:on

        this.db.run(insertCommand)
    }

    async getData(table, columns = "*", condition = "") {
        return new Promise((resolve => {
            // @formatter:off
            this.db.all(`select ${columns} from ${table} ${condition}`, (err, res) => {
            // @formatter:on
                resolve(res)
            })
        }))
    }

    async customCommand(command) {
        return new Promise((resolve => {
            // @formatter:off
            this.db.all(command, (err, res) => {
            // @formatter:on
                resolve(res)
            })
        }))
    }
}
