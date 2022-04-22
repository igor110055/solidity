/**
 * type: Database
 */
class Database {
    constructor() {
        /**
         * @type {mysqlAwait.MySQLAwait}
         */
        this.MySQL = require('mysql-await')

        this.tables = require(__dirname + "/tables.json")
        this.config = require(__dirname + "/config.json")

        this.databaseName = this.config.database
    }

    /**
     * @returns {Promise<void>}
     */
    async setup() {
        this.con = this.MySQL.createConnection(this.config);
        await this.con.connect()
        console.log(`\x1b[32mConnected to database\x1b[0m`)

        if (this.tables.length > 0) {
            for (const table of this.tables) {
                await this.createTable(table["name"], table["columns"])
            }
        }

        setInterval(() => {
            this.custom(
                `SELECT table_name FROM information_schema.tables WHERE table_schema="${this.databaseName}" limit 1`
            )
        }, 15000)
    }

    /**
     * @param tableName
     * @param columns
     * @returns {Promise<void>}
     */
    async createTable(tableName, columns) {
        let existingTables = await this.custom(
            `SELECT table_name FROM information_schema.tables WHERE table_schema="${this.databaseName}"`
        )
        existingTables = existingTables.map(t => t["table_name"])

        if (!existingTables.includes(tableName)) {
            let formattedColumns = []
            for (const column in columns)
                formattedColumns.push(`${column} ${columns[column]}`)

            await this.con.awaitQuery(`create table ${tableName} (${formattedColumns.join(", ")})`)
        }
    }

    /**
     * @param tableName
     * @param jsonData
     * @returns {Promise<string>}
     */
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

    /**
     * @param tableName
     * @param jsonColumns
     * @param dataJsonArray
     * @returns {Promise<string>}
     */
    async insertMultiple(tableName, jsonColumns, dataJsonArray) {
        return new Promise(async resolve => {
            let insertValues = []
            for (const jsonData of dataJsonArray) {
                let values = []
                for (const columnValue in jsonData)
                    if (jsonData[columnValue].toString().startsWith("("))
                        values.push(`${jsonData[columnValue]}`)
                    else
                        values.push(`"${jsonData[columnValue]}"`)

                insertValues.push("(" + values.join(", ") + ")")
            }

            return resolve(this.con.awaitQuery(
                `insert ignore into ${tableName} (${jsonColumns.join(", ")}) values ${insertValues.join(", ")} `
            ))
        })
    }

    /**
     * @param tableName
     * @param columns
     * @param condition
     * @returns {Promise<string[]>}
     */
    async select(tableName, columns = "*", condition = "") {
        return new Promise((resolve => {
            return resolve(this.con.awaitQuery(`select ${columns} from ${tableName} ${condition}`))
        }))
    }

    /**
     * @param tableName
     * @param jsonConditions
     * @param jsonData
     * @returns {Promise<boolean>}
     */
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

    /**
     * @param tableName
     * @param columnsArray
     * @param dataJsonArray
     * @param key
     * @returns {Promise<boolean>}
     */
    async updateMultiple(tableName, columnsArray, dataJsonArray, key) {
        return new Promise(async resolve => {
            if (columnsArray !== undefined && dataJsonArray !== undefined && key !== undefined) {
                let insertValues = []
                for (const jsonData of dataJsonArray) {
                    let values = []
                    for (const columnValue in jsonData)
                        if (jsonData[columnValue].toString().startsWith("("))
                            values.push(`${jsonData[columnValue]}`)
                        else
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

    /**
     * @param command
     * @returns {Promise<string>}
     */
    async custom(command) {
        return new Promise(resolve => {
            return resolve(this.con.awaitQuery(command))
        })
    }
}

module.exports = Database
