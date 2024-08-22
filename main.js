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
		console.log("configUpdated")
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
		console.log("connect()")
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
			console.log("LOGIN", JSON.stringify(data))
			this.auth = `JWT ${data.token}`
			token = data.token
			this.updateStatus(InstanceStatus.Ok)
		})
		.catch(error => {
			console.error('Error:', error)
			this.updateStatus(InstanceStatus.Disconnected, JSON.stringify(error))
		})
		console.log("AUTH", this.auth)
		if (this.auth != "") {
			this.ws = new WebSocket(this.config.websocket + 'ws/core/?jwt_token=' + token)

			this.ws.on('open', () => {
				console.log('The connection is made')
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

	queryParams() {
		console.log("QUERYPARAMS:", JSON.stringify(this.config))
		var params = {
			user_field_names: 'true',
			size: this.config.result_limit,
		}
		if (this.config.usefilter == 'search') {
			params['search'] = this.config.search
		} else if (this.config.usefilter == 'json') {
			params['filter'] = this.config.json_filter
		} else if (this.config.usefilter == 'boolean') {
			params['filters'] = JSON.stringify({
				filter_type: "AND",
				filters: [{
					type: "boolean",
					field: String(this.config.boolean_field),
					value: String(this.config.boolean_value)
				}],
				groups: []
			})
		} else if (this.config.usefilter == 'range') {
			params['filters'] = JSON.stringify({
				filter_type: "AND",
				filters: [
					{
						type: "higher_than_or_equal",
						field: String(this.config.range_field),
						value: String(this.config.range_from)
					}, {
						type: "lower_than_or_equal",
						field: String(this.config.range_field),
						value: String(this.config.range_to),
					}
				],
				groups: []
			})
		} else if (this.config.usefilter == 'text') {
			params['filters'] = JSON.stringify({
				filter_type: "AND",
				filters: [{
					type: String(this.config.text_operator),
					field: String(this.config.text_field),
					value: String(this.config.text_parameter)
				}],
				groups: []
			})
		}

		if (this.config.order_by != '') {
			params['order_by'] = this.config.order_by
		}
		var searchParams = new URLSearchParams(params)
		console.log("QUERY STRING", searchParams.toString())
		return searchParams.toString()
	}

	handleWSMessage() {
		return async (data) => {
			data = JSON.parse(String(data))
			console.log(data)
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
