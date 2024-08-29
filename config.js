const { FILTER } = require('./filter')

const { Regex } = require('@companion-module/base')
module.exports = function (self) {
	return [
		{
			type: 'textinput',
			id: 'api',
			label: 'URL of the API endpoint',
			width: 12,
			regex: Regex.URL,
			default: 'https://api.baserow.io/',
		},
		{
			type: 'textinput',
			id: 'username',
			label: 'Username',
			default: '',
			width: 6,
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			default: '',
			width: 6,
		},
		{
			type: 'textinput',
			id: 'tableId',
			label: 'Comma separated list of table IDs to generate variables for',
			width: 12,
		},

		...FILTER,

		// ---------------- result limit
		{
			type: 'number',
			id: 'result_limit',
			label: 'Maximum number of results (0=no limit)',
			width: 12,
			default: 100,
			minimum: 1,
		},
		// ---------------- order by
		{
			type: 'textinput',
			id: 'order_by',
			label: 'Order by',
			width: 12,
			tooltip: 'Comma separated list of column names',
			default: '',
		},
		// ---------------- variable naming
		{
			type: 'dropdown',
			id: 'variable_naming',
			label: 'Row naming pattern for variables',
			width: 12,
			default: 'row_nr',
			tooltip: 'Variable names are composed of the table ID, the row ID/number/name, and the field name',
			choices: [
				{ id: 'row_id', label: 'Baserow row id' },
				{ id: 'row_nr', label: 'Consecutive row number' },
				{ id: 'row_name', label: 'Row name' },
			],
		},
	]
}
