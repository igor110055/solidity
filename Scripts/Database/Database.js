module.exports = class Database {
    constructor() {
        this.fs = require("fs")
        this.config = JSON.parse(this.fs.readFileSync(__dirname + "/config.json").toString())
        this.saveConfig = () => this.fs.writeFileSync(__dirname + "/config.json", JSON.stringify(this.config, null, 3))

        this.sqlite3 = require("sqlite3")
    }

    async setup() {
        const tableNames = Object.keys(this.config["tables"])
        if (tableNames.length === 0) {
            throw new Error("Specify table in config.json first.")
        } else {
            this.databases = []
            const tableNames = Object.keys(this.config["tables"])

            for (let i = 0; i < tableNames.length; i++) {
                const databasePath = `${__dirname}${this.config["databaseDirectory"]}${tableNames[i]}.db`
                const tempDatabase = new this.sqlite3.Database(databasePath)
                this._setupTable(tempDatabase, tableNames[i])
                this.databases.push(tempDatabase)

                if (i === 0) {
                    this.db = tempDatabase
                } else {
                    await this.customCommand(`attach database '${databasePath}' as ${tableNames[i]}`)
                }
            }
        }
    }

    _setupTable(database, tableName) {
        // @formatter:off
        database.all("SELECT name FROM sqlite_master WHERE type='table'", (error, result) => {
        // @formatter:on
            const existingTables = result.map(t => t["name"])

            if (!existingTables.includes(tableName)) {
                let columns = []
                for (const column in this.config["tables"][tableName])
                    columns.push(`${column} ${this.config["tables"][tableName][column]}`)
                // @formatter:off
                database.run(`create table ${tableName} (${columns.join(", ")})`)
                // @formatter:on
            }
        })
    }

    saveData(tableName, jsonData = "") {
        let insertCommand
        if (jsonData !== "") {
            let values = []
            for (const columnValue in jsonData)
                values.push(`"${jsonData[columnValue]}"`)
            // @formatter:off
            insertCommand = `insert into ${tableName} (${Object.keys(jsonData).join(", ")}) values (${values.join(", ")})`
            // @formatter:on
        } else {
            // @formatter:off
            insertCommand = `insert into ${tableName} default values`
            // @formatter:on
        }

        this.db.run(insertCommand)
    }

    async getData(tableName, columns = "*", condition = "") {
        return new Promise((resolve => {
            // @formatter:off
            this.db.all(`select ${columns} from ${tableName} ${condition}`, (_, result) => {
            // @formatter:on
                return resolve(result)
            })
        }))
    }

    async updateData(tableName, jsonConditions, jsonData) {
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
            this.db.run(`update ${tableName} set ${formattedValues.join(", ")} where ${formattedConditions.join(" AND ")}`)
            // @formatter:on
        }
    }

    async customCommand(command) {
        return new Promise(resolve => {
            this.db.run(command, (_, result) => {
                return resolve(result)
            })
        })
    }

    async customGetCommand(command) {
        return new Promise((resolve => {
            this.db.all(command, (_, result) => {
                return resolve(result)
            })
        }))
    }
}
