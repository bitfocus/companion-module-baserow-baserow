const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const GetConfigFields = require('./config')
const { UpdateVariableDefinitions, UpdateTableRow } = require('./variables')
const WebSocket = require('ws')

let debounceFn

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		if (debounceFn == undefined) {
			const debounceModule = await import('debounce-fn')
			debounceFn = debounceModule.default
		}

		this.debounceUpdateVariableDefinitions = debounceFn(this.updateVariableDefinitions, {
			wait: 100,
			maxWait: 600,
			before: false,
		})

		this.updateStatus(InstanceStatus.Ok)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		// this.updateVariableDefinitions() // export variable definitions
		this.auth = ""
		this.state = {}
		this.fieldNames = new Map()
		this.configUpdated(config)
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		if (!config.api.startsWith('http')) {
			this.updateStatus(InstanceStatus.BadConfig, 'API endpoint address must be a URL')
			return
		}
		if (!this.config.api.endsWith("/")) {
			this.config.api += "/"
		}

		if (config.username == "" || config.password == "")
		{
			this.updateStatus(InstanceStatus.BadConfig, 'Login credentials must not be empty')
			return
		}
		const host = this.config.api.split("/")[2]
		const path = this.config.api.split("/").splice(3).join("/")

		if (this.config.api.startsWith("https")) {
			this.config.websocket = "wss://" + host + "/" + path
		} else {
			this.config.websocket = "ws://" + host + "/" + path
		}
		await this.connect()
	}

	async connect() {
		const url = this.config.api + "api/user/token-auth/"
		let token = ""
		this.updateStatus(InstanceStatus.Connecting)
		await fetch(url, {
			method: 'POST',
			headers: {
					'Content-Type': 'application/json'
			},
			body: JSON.stringify({username: this.config.username, password: this.config.password})
		})
		.then(response => response.json()) // Parse the JSON from the response
		.then(data => {
			this.auth = `JWT ${data.token}`
			token = data.token
			this.updateStatus(InstanceStatus.Ok)
		})
		.catch(error => {
			this.log('error', error)
			this.updateStatus(InstanceStatus.Disconnected, JSON.stringify(error))
		})
		if (this.auth != "") {
			this.ws = new WebSocket(this.config.websocket + 'ws/core/?jwt_token=' + token)

			this.ws.on('open', () => {
				this.log('debug', 'The connection is made')
				this.updateVariableDefinitions()
				const keepAliveInterval = setInterval(() => {
						if (this.ws.readyState === WebSocket.OPEN) {
								//this.ws.send(JSON.stringify({ type: 'ping' }));
						}
				}, 30000) // Send a ping message every 30 seconds
			})

			this.ws.on('error', (event) => {
				this.log('error', JSON.stringify(event))
			})

			this.ws.on('message', this.handleWSMessage())
		}
	}

	queryParams(options) {
		var params = {
			user_field_names: 'true',
			size: options.result_limit,
		}
		if (options.usefilter == 'search') {
			params['search'] = options.search
		} else if (options.usefilter == 'json') {
			params['filter'] = options.json_filter
		} else if (options.usefilter == 'boolean') {
			params['filters'] = JSON.stringify({
				filter_type: "AND",
				filters: [{
					type: "boolean",
					field: String(options.boolean_field),
					value: String(options.boolean_value)
				}],
				groups: []
			})
		} else if (options.usefilter == 'range') {
			params['filters'] = JSON.stringify({
				filter_type: "AND",
				filters: [
					{
						type: "higher_than_or_equal",
						field: String(options.range_field),
						value: String(options.range_from)
					}, {
						type: "lower_than_or_equal",
						field: String(options.range_field),
						value: String(options.range_to),
					}
				],
				groups: []
			})
		} else if (options.usefilter == 'text') {
			params['filters'] = JSON.stringify({
				filter_type: "AND",
				filters: [{
					type: String(options.text_operator),
					field: String(options.text_field),
					value: String(options.text_parameter)
				}],
				groups: []
			})
		}

		if (options.order_by != undefined && options.order_by != '') {
			params['order_by'] = options.order_by
		}
		var searchParams = new URLSearchParams(params)

		return searchParams.toString()
	}

	handleWSMessage() {
		return async (data) => {
			data = JSON.parse(String(data))

			if (data.type == undefined) {
				return
			}
			if (data.type == "rows_deleted" || data.type == "rows_created") {
				this.debounceUpdateVariableDefinitions()
			} else if (data.type == 'rows_updated') {
				if (this.config.usefilter == 'none') {
					this.updateTableRow(data.table_id, data.rows[0])
					this.setVariableValues(this.state)
				} else {
					this.updateVariableDefinitions()
				}
			}
		}
	}

	async baserowGet(path) {
		return fetch(this.config.api + path, {
			method: 'GET',
			headers: {
					'Content-Type': 'application/json',
					'Authorization': this.auth
			}})
			.then(response => response.json())
	}

	async baserowPatch(path, data) {
		return fetch(this.config.api + path, {
			method: 'PATCH',
			headers: {
					'Content-Type': 'application/json',
					'Authorization': this.auth
			},
			body: JSON.stringify(data),
		}).then(response => response.json())
	}

	// Return config fields for web config
	getConfigFields() {
		return GetConfigFields(this)
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	updateTableRow(table, row) {
		UpdateTableRow(this, table, row)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
