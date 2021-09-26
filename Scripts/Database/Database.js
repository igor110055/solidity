module.exports = class Database {
    constructor() {
        this.fs = require("fs")
        this.config = JSON.parse(this.fs.readFileSync(__dirname + "/config.json").toString())
        this.saveConfig = () => this.fs.writeFileSync(__dirname + "/config.json", JSON.stringify(this.config, null, 3))

        this.sqlite3 = require("sqlite3")

        this.databases = {}

        for (const database in this.config["databases"]) {
            const databasePath = `${__dirname}${this.config["databaseDirectory"]}${database}.db`
            this.databases[database] = new this.sqlite3.Database(databasePath)
            this._setupTables(database)
        }
    }

    _setupTables(databaseName) {
        const tables = this.config["databases"][databaseName]["tables"]

        // @formatter:off
        this.databases[databaseName].all("SELECT name FROM sqlite_master WHERE type='table'", (error, result) => {
        // @formatter:on
            const existingTables = result.map(t => t["name"])

            for (const table in tables) {
                if (!existingTables.includes(table)) {
                    let columns = []
                    for (const column in tables[table])
                        columns.push(`${column} ${tables[table][column]}`)

                    // @formatter:off
                    this.databases[databaseName].run(`create table ${table} (${columns.join(", ")})`)
                    // @formatter:on
                }
            }
        })
    }

    saveData(exchange, jsonData = "") {
        let insertCommand
        if (jsonData !== "") {
            let values = []
            for (const columnValue in jsonData)
                values.push(`"${jsonData[columnValue]}"`)
            // @formatter:off
            insertCommand = `insert into ${exchange.tableName} (${Object.keys(jsonData).join(", ")}) values (${values.join(", ")})`
            // @formatter:on
        } else {
            // @formatter:off
            insertCommand = `insert into ${exchange.tableName} default values`
            // @formatter:on
        }

        this.databases[exchange.databaseName].run(insertCommand)
    }

    async getData(exchange, columns = "*", condition = "") {
        return new Promise((resolve => {
            // @formatter:off
            this.databases[exchange.databaseName].all(`select ${columns} from ${exchange.tableName} ${condition}`, (error, result) => {
            // @formatter:on
                resolve(result)
            })
        }))
    }

    async customGetCommand(exchange, command) {
        return new Promise((resolve => {
            // @formatter:off
            this.databases[exchange.databaseName].all(command, (err, res) => {
            // @formatter:on
                resolve(res)
            })
        }))
    }

    async updateData(exchange, jsonConditions, jsonData) {
        if (jsonConditions === undefined || jsonData === undefined) {
            throw new Error("Enter some values bro")
        } else {
            let formattedConditions = []
            for (const condition in jsonConditions) {
                formattedConditions.push(`${condition}="${jsonConditions[condition]}"`)
            }

            let formattedValues = []
            for (const column in jsonData) {
                formattedValues.push(`${column}="${jsonData[column]}"`)
            }

            // @formatter:off
            this.databases[exchange.databaseName].run(
                `update ${exchange.tableName} set ${formattedValues.join(", ")} where ${formattedConditions.join(" AND ")}`
            )
            // @formatter:on
        }
    }
}
