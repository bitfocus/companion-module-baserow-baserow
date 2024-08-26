const { InstanceStatus } = require('@companion-module/base')

module.exports = {
	UpdateVariableDefinitions,
	UpdateTableRow
}

async function UpdateVariableDefinitions(self) {
	var variableDefinitions = []
	var error = false

	var promises = self.config.tableId.split(",").map( async (table) => {
		subscribeToTable(self, table)
		var URL = self.config.api + 'api/database/rows/table/' + table + '/?' + self.queryParams()
		return fetch(URL, {
		method: 'GET',
		headers: {
				'Content-Type': 'application/json',
				'Authorization': self.auth
		}})
		.then(response => response.json())
		.then(async (rows) => {
			//console.log("ROWS:",rows, JSON.stringify(rows, null, 4))

			if (rows.error != undefined) {
				self.updateStatus(InstanceStatus.Disconnected, rows.error + ": " + rows.detail)
				error = true
				return
			}
			self.fieldNames.set(table, await getTableFieldNames(self, table))
			var rowNr = 1
			rows.results.forEach( (row) => {
				//console.log("-----------", row)
				variableDefinitions.push(...UpdateTableRow(self, table, row, rowNr))				
				rowNr++
			})
		})
	})

	await Promise.all(promises)
	if (!error) {
		//console.log("=========================================")
		//console.log("VAR DEF", variableDefinitions)
		self.setVariableDefinitions(variableDefinitions)
		//console.log("STATE", self.state)
		self.setVariableValues(self.state)
	}
}

function UpdateTableRow(self, table, row, rowNr = 1) {
	var variableDefinitions = []
	table = String(table)
	console.log("UPDATE TABLE", table, "ROW", JSON.stringify(row))
	console.log("--- type", typeof(table))
	self.fieldNames.get(table).forEach( (field) => {
		console.log("FIELD", field)
		var value
		if (typeof(row[field.name]) == "object") {
			if (row[field.name] == null) {
				value = ""
			} else {
				value = row[field.name].value || row[field.name].name
			}
		} else {
			value = row[field.name]
		}
		var rowId = row.id
		if (self.config.variable_naming == "row_nr") {
			rowId = rowNr
		} else if (self.config.variable_naming == "row_name") {
			//rowId = self.fieldNames.get(table)[0].name
			rowId = row[self.fieldNames.get(table)[0].name]
			console.log(rowId, JSON.stringify(rowId))
		}
		var fieldName = variableName(table, rowId, field.name)

		console.log(`UpdateTableRow ### Variable: ${fieldName} = ${value}`)
		self.state[fieldName] = value
		variableDefinitions.push({variableId: fieldName, name: `Table ${table}, Row ${rowId}${rowId != row.id ? " ("+row.id+")":""}, Field "${field.name}"`})
	})
	return variableDefinitions
}

async function getTableFieldNames(self, table) {
	var fieldNames = []
	 
	/*await fetch(self.config.api + 'api/database/fields/table/' + table + '/', {
        method: 'GET',
        headers: {
                'Content-Type': 'application/json',
                'Authorization': self.auth
        }})
        .then(response => response.json()) */
    await self.baserowGet('api/database/fields/table/' + table + '/')
			.then(data => {
			//console.log("FIELDNAMES inner", JSON.stringify(data, null, 4))
			data.forEach( (field) => {
				fieldNames.push({id:"field_" + field.id, name: field.name})
			})
		})
	//console.log("FIELDNAMES", fieldNames.length, fieldNames, JSON.stringify(fieldNames), fieldNames.length)
	return fieldNames
}

function variableName(tableName, rowId, fieldname) {
	return `table_${tableName}_${rowId}_${fieldname}`.replace(/[^A-Za-z0-9_]/g, "_")
}

//function variableName(name) {
//	return name.replace(/[^A-Za-z0-9_]/g, "_")
//}

async function subscribeToTable(self, table) {
	var message = {
		page: "table",
		table_id: String(table),
	}
	console.log(JSON.stringify(message, null, 4))
	await self.ws.send(JSON.stringify(message))
}
