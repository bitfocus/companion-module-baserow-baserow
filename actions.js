const { FILTER } = require('./filter')

module.exports = function (self) {
	self.setActionDefinitions({
		update: {
			name: 'Update Field',
			options: [
				{
					type: 'textinput',
					id: 'table',
					label: 'Table ID',
					width: 12,
					tooltip: 'Numerical table ID of the table that shall be updated',
					default: '',
				},
				...FILTER,
				{
					type: 'number',
					id: 'resultNumber',
					label: 'Number of the line to change',
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
				},

			],
			callback: async (event) => {
				console.log('Hello world!', event.options.resultNumber)
			},
		},
	})
}
