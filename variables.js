const { InstanceStatus } = require('@companion-module/base')

module.exports = {
	UpdateVariableDefinitions,
	UpdateTableRow,
}

async function UpdateVariableDefinitions(self) {
	var variableDefinitions = []
	var error = false

	var promises = self.config.tableId.split(',').map(async (table) => {
		subscribeToTable(self, table)
		var path = 'api/database/rows/table/' + table + '/?' + self.queryParams(self.config)
		return self.baserowGet(path).then(async (rows) => {
			if (rows.error != undefined) {
				self.updateStatus(InstanceStatus.Disconnected, rows.error + ': ' + rows.detail)
				error = true
				return
			}
			self.fieldNames.set(table, await getTableFieldNames(self, table))
			var rowNr = 1
			rows.results.forEach((row) => {
				variableDefinitions.push(...UpdateTableRow(self, table, row, rowNr))
				rowNr++
			})
		})
	})

	await Promise.all(promises)
	if (!error) {
		self.setVariableDefinitions(variableDefinitions)
		self.setVariableValues(self.state)
	}
}

function UpdateTableRow(self, table, row, rowNr = 1) {
	var variableDefinitions = []
	table = String(table)
	self.fieldNames.get(table).forEach((field) => {
		var value
		if (typeof row[field.name] == 'object') {
			if (row[field.name] == null) {
				value = ''
			} else {
				value = row[field.name].value || row[field.name].name
			}
		} else {
			value = row[field.name]
		}
		var rowId = row.id
		if (self.config.variable_naming == 'row_nr') {
			rowId = rowNr
		} else if (self.config.variable_naming == 'row_name') {
			rowId = row[self.fieldNames.get(table)[0].name]
		}
		var fieldName = variableName(table, rowId, field.name)

		self.state[fieldName] = value
		variableDefinitions.push({
			variableId: fieldName,
			name: `Table ${table}, Row ${rowId}${rowId != row.id ? ' (' + row.id + ')' : ''}, Field "${field.name}"`,
		})
	})
	return variableDefinitions
}

async function getTableFieldNames(self, table) {
	var fieldNames = []

	await self.baserowGet('api/database/fields/table/' + table + '/').then((data) => {
		data.forEach((field) => {
			fieldNames.push({ id: 'field_' + field.id, name: field.name })
		})
	})
	return fieldNames
}

function variableName(tableName, rowId, fieldname) {
	return `table_${tableName}_${rowId}_${fieldname}`.replace(/[^A-Za-z0-9_]/g, '_')
}

function subscribeToTable(self, table) {
	var message = {
		page: 'table',
		table_id: String(table),
	}
	try {
		 self.ws.send(JSON.stringify(message), (error) => {self.log("error",error)})
	} catch (error) {
		self.log("error", error)
	}
}
