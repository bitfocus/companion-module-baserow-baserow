const FILTER = [
	{
		type: 'dropdown',
		id: 'usefilter',
		label: 'Filter',
		width: 12,
		default: 'none',
		choices: [
			{ id: 'none', label: 'No filter' },
			{ id: 'json', label: 'JSON filter string' },
			{ id: 'range', label: 'Numerical range filter' },
			{ id: 'boolean', label: 'Boolean (checkbox) value filter' },
			{ id: 'search', label: 'Simple text search' },
			{ id: 'text', label: 'Advanced text (string) filter' },
		],
	},
	// ---------------- JSON filter
	{
		id: 'filler_2',
		type: 'static-text',
		label: '',
		width: 1,
		value: '',
		isVisible: (options) => options.usefilter == 'json',
	},
	{
		type: 'textinput',
		id: 'json_filter',
		label: 'JSON filter',
		tooltip:
			`A JSON serialized string containing the filter tree to apply to this view.\n` +
			`You can use baserow's "Filters parameter builder" to create the JSON query. ` +
			`You can find it by opening the API Docs from the baserow database context menu and clicking on "List rows" from the table you want to use.`,
		width: 11,
		isVisible: (options) => options.usefilter == 'json',
	},
	// ---------------- Range filter
	{
		id: 'filler_5',
		type: 'static-text',
		label: '',
		width: 1,
		value: '',
		isVisible: (options) => options.usefilter == 'range',
	},
	{
		type: 'textinput',
		id: 'range_field',
		label: 'Field name',
		width: 11,
		isVisible: (options) => options.usefilter == 'range',
	},
	{
		id: 'filler_4',
		type: 'static-text',
		label: '',
		width: 1,
		value: '',
		isVisible: (options) => options.usefilter == 'range',
	},
	{
		type: 'textinput',
		id: 'range_from',
		label: 'From (inclusive)',
		width: 5,
		isVisible: (options) => options.usefilter == 'range',
	},
	{
		type: 'textinput',
		id: 'range_to',
		label: 'To (inclusive)',
		width: 6,
		isVisible: (options) => options.usefilter == 'range',
	},
	// ---------------- Boolean filter
	{
		id: 'filler_6',
		type: 'static-text',
		label: '',
		width: 1,
		value: '',
		isVisible: (options) => options.usefilter == 'boolean',
	},
	{
		type: 'textinput',
		id: 'boolean_field',
		label: 'Field name',
		width: 11,
		isVisible: (options) => options.usefilter == 'boolean',
	},
	{
		id: 'filler_7',
		type: 'static-text',
		label: '',
		width: 1,
		value: '',
		isVisible: (options) => options.usefilter == 'boolean',
	},
	{
		type: 'dropdown',
		id: 'boolean_value',
		label: '',
		width: 11,
		default: '1',
		choices: [
			{ id: '1', label: 'Yes, checkbox is checked ("true")' },
			{ id: '0', label: 'No, checkbox is not checked ("false")' },
		],
		isVisible: (options) => options.usefilter == 'boolean',
	},
	// ---------------- Search filter
	{
		id: 'filler_8',
		type: 'static-text',
		label: '',
		width: 1,
		value: '',
		isVisible: (options) => options.usefilter == 'search',
	},
	{
		type: 'textinput',
		id: 'search',
		label: 'Search string',
		width: 11,
		isVisible: (options) => options.usefilter == 'search',
	},
	// ---------------- Text filter
	{
		id: 'filler_9',
		type: 'static-text',
		label: '',
		width: 1,
		value: '',
		isVisible: (options) => options.usefilter == 'text',
	},
	{
		type: 'textinput',
		id: 'text_field',
		label: 'Field name',
		width: 11,
		isVisible: (options) => options.usefilter == 'text',
	},
	{
		id: 'filler_10',
		type: 'static-text',
		label: '',
		width: 1,
		value: '',
		isVisible: (options) => options.usefilter == 'text',
	},
	{
		type: 'dropdown',
		id: 'text_operator',
		label: 'Operator',
		width: 4,
		default: 'equal',
		choices: [
			{ id: 'equal', label: 'is equal' },
			{ id: 'not_equal', label: 'is not equal' },
			{ id: 'contains', label: 'contains' },
			{ id: 'contains_not', label: "doesn't contain" },
			{ id: 'contains_word', label: 'contains word' },
			{ id: 'doesnt_contain_word', label: "doesn't contain word" },
			{ id: 'length_is_lower_than', label: 'length is lower than' },
			{ id: 'empty', label: 'is empty' },
			{ id: 'not_empty', label: 'is not empty' },
		],
		isVisible: (options) => options.usefilter == 'text',
	},
	{
		type: 'textinput',
		id: 'text_parameter',
		label: 'Parameter',
		width: 7,
		isVisible: (options) =>
			options.usefilter == 'text' && options.text_operator != 'isempty' && options.text_operator != 'isnotempty',
	},
]

module.exports = {
	FILTER,
}
