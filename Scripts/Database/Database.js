module.exports = class Database {
    constructor() {
        this.tables = require(__dirname + "/tables.json")
        this.mysql = require('mysql-await');
        this.loginData = require(__dirname + "/config.json")
        this.pingIntervall = 7500

        this.databaseName = this.loginData["database"]
    }

    async setup() {
        this.con = this.mysql.createConnection(this.loginData);
        await this.con.connect()

        const tableNames = Object.keys(this.tables)
        if (tableNames.length === 0) {
            throw new Error("Specify table in tables.json first.")
        } else {
            await this._setupTables(tableNames)
        }
        setInterval(async () => {
            this.custom("select * from information_schema.KEYWORDS limit 1").then()
        }, this.pingIntervall)
    }

    async _setupTables(tableNames) {
        const results = await this.con.awaitQuery(
            `SELECT table_name FROM information_schema.tables WHERE table_schema="${this.databaseName}"`
        )

        const existingTables = results.map(t => t["table_name"])
        for (const table of tableNames) {
            if (!existingTables.includes(table)) {
                let columns = []
                for (const column in this.tables[table])
                    columns.push(`${column} ${this.tables[table][column]}`)

                await this.con.awaitQuery(`create table ${table} (${columns.join(", ")})`)
            }
        }
    }

    async insert(tableName, jsonData = "") {
        return new Promise(async resolve => {
            let insertCommand
            if (jsonData !== "") {
                let values = []
                for (const columnValue in jsonData)
                    values.push(`"${jsonData[columnValue]}"`)
                insertCommand = `insert into ${tableName} (${Object.keys(jsonData).join(", ")}) values (${values.join(", ")})`
            } else {
                insertCommand = `insert into ${tableName} () values()`
            }

            return resolve(this.con.awaitQuery(insertCommand))
        })
    }

    async insertMultiple(tableName, jsonColumns = undefined, dataJsonArray = undefined, defaultsAmount = undefined) {
        return new Promise(async resolve => {
            if (jsonColumns !== undefined && dataJsonArray !== undefined) {
                let insertValues = []
                for (const jsonData of dataJsonArray) {
                    let values = []
                    for (const columnValue in jsonData)
                        values.push(`"${jsonData[columnValue]}"`)

                    insertValues.push("(" + values.join(", ") + ")")
                }
                return resolve(this.con.awaitQuery(
                    `insert into ${tableName} (${jsonColumns.join(", ")}) values ${insertValues.join(", ")}`
                ))
            } else if (defaultsAmount !== undefined) {
                let insertValues = []
                for (let i = 0; i < defaultsAmount; i++) {
                    insertValues.push(`()`)
                }
                return resolve(this.con.awaitQuery(
                    `insert into ${tableName} () values${insertValues.join(", ")}`
                ))
            }
        })
    }

    async select(tableName, columns = "*", condition = "") {
        return new Promise((resolve => {
            return resolve(this.con.awaitQuery(`select ${columns} from ${tableName} ${condition}`))
        }))
    }

    async update(tableName, jsonConditions, jsonData) {
        return new Promise(async resolve => {
            if (jsonConditions !== undefined && jsonData !== undefined) {
                let formattedConditions = []
                for (const condition in jsonConditions) {
                    formattedConditions.push(`${condition}="${jsonConditions[condition]}"`)
                }

                let formattedValues = []
                for (const column in jsonData) {
                    formattedValues.push(`${column}="${jsonData[column]}"`)
                }

                return resolve(this.con.awaitQuery(
                    `update ${tableName} set ${formattedValues.join(", ")} where ${formattedConditions.join(" AND ")}`
                ))
            }
        })
    }

    async updateMultiple(tableName, columnsArray, dataJsonArray, key) {
        return new Promise(async resolve => {
            if (columnsArray !== undefined && dataJsonArray !== undefined && key !== undefined) {
                let insertValues = []
                for (const jsonData of dataJsonArray) {
                    let values = []
                    for (const columnValue in jsonData)
                        values.push(`"${jsonData[columnValue]}"`)

                    insertValues.push("(" + values.join(", ") + ")")
                }

                let updateValues = []
                for (const column of columnsArray) {
                    if (column !== key)
                        updateValues.push(`${column} = values(${column})`)
                }

                return resolve(this.con.awaitQuery(
                    `insert into ${tableName} (${columnsArray.join(", ")}) values${insertValues.join(", ")}
                    on duplicate key update ${updateValues.join(", ")}`
                ))
            }
        })
    }

    async custom(command) {
        return new Promise(resolve => {
            return resolve(this.con.awaitQuery(command))
        })
    }
}
