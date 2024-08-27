const { FILTER } = require('./filter')

module.exports = function (self) {
	self.setActionDefinitions({
		update: {
			name: 'Update Field',
			options: [
				{
					type: 'textinput',
					id: 'tableID',
					label: 'Table ID',
					width: 12,
					tooltip: 'Numerical table ID of the table that shall be updated',
					default: '',
				},
				...FILTER,
				{
					type: 'number',
					id: 'result_limit',
					label: 'Number of the row to change',
					width: 12,
					default: 1,
					minimum: 1,
				},
				{
					type: 'textinput',
					id: 'fieldName',
					label: 'Field name',
					width: 12,
				},
				{
					type: 'textinput',
					id: 'value',
					label: 'Set to value',
					width: 12,
					useVariables: true,
				},

			],
			callback: async (event) => {
				var path = 'api/database/rows/table/' + event.options.tableID + '/?' + self.queryParams(event.options)				
				var data = await self.baserowGet(path)

				if (data.error != undefined) {
					self.log("error", JSON.stringify(data, null, 3))
				}

				const row_id = data.results[event.options.result_limit-1].id
				var request = {}
				request[event.options.fieldName] = await self.parseVariablesInString(event.options.value)
				self.baserowPatch(`api/database/rows/table/${event.options.tableID}/${row_id}/?user_field_names=true`, request)
			},
		},
	})
}
