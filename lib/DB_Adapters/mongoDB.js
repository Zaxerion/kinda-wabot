import mongoose from 'mongoose'

const { Schema, connect, model: _model } = mongoose

export class mongoDB {
	constructor(url, options = {}) {
		this.url = url
		this.options = options
		this.data = this._data = {}
		this._schema = {}
		this._model = {}
		this.db = connect(this.url, { ...this.options }).catch(console.error)
	}

	async read() {
		this.conn = await this.db
		this._schema = new Schema({
			data: {
				type: Object,
				required: true,
				default: {}
			}
		})
		try {
			this._model = _model('data', this._schema)
		} catch {
			this._model = _model('data')
		}

		this._data = await this._model.findOne({})
		if (!this._data) {
			this.data = {}
			await this.write(this.data)
			this._data = await this._model.findOne({})
		} else {
			this.data = this._data.data
		}
		return this.data
	}

	async write(data) {
		if (!data) throw new Error("No data provided")
		if (!this._data) {
			return await new this._model({ data }).save()
		}
		const doc = await this._model.findById(this._data._id)
		if (!doc) throw new Error("Document not found")
		doc.data = data
		this.data = {}
		return await doc.save()
	}
}

export const mongoDBV2 = class MongoDBV2 {
	constructor(url, options = {}) {
		this.url = url
		this.options = options
		this.models = []
		this.data = {}
		this.lists = null
		this.list = null
		this.db = connect(this.url, { ...this.options }).catch(console.error)
	}

	async read() {
		this.conn = await this.db
		const schema = new Schema({
			data: [{ name: String }]
		})
		try {
			this.list = _model('lists', schema)
		} catch {
			this.list = _model('lists')
		}

		this.lists = await this.list.findOne({})
		if (!this.lists?.data) {
			await this.list.create({ data: [] })
			this.lists = await this.list.findOne({})
		}

		const garbage = []

		await Promise.all(this.lists.data.map(async ({ name }) => {
			let collection
			try {
				collection = _model(name, new Schema({ data: Array }))
			} catch (e) {
				try {
					collection = _model(name)
				} catch (err) {
					garbage.push(name)
					console.error(err)
				}
			}

			if (collection) {
				const index = this.models.findIndex(v => v.name === name)
				if (index !== -1) {
					this.models[index].model = collection
				} else {
					this.models.push({ name, model: collection })
				}
				const collectionsData = await collection.find({})
				this.data[name] = Object.fromEntries(collectionsData.map(v => v.data))
			}
		}))

		try {
			const del = await this.list.findById(this.lists._id)
			del.data = del.data.filter(v => !garbage.includes(v.name))
			await del.save()
		} catch (e) {
			console.error(e)
		}

		return this.data
	}

	async write(data) {
		if (!this.lists || !data) throw new Error("Missing list or data")

		const collections = Object.keys(data)
		const listDoc = []

		await Promise.all(collections.map(async (key) => {
			const index = this.models.findIndex(v => v.name === key)

			if (index !== -1) {
				const doc = this.models[index].model
				if (Object.keys(data[key]).length > 0) {
					await doc.deleteMany().catch(console.error)
					await doc.insertMany(Object.entries(data[key]).map(v => ({ data: v })))
				}
				listDoc.push({ name: key })
			} else {
				const schema = new Schema({ data: Array })
				let doc
				try {
					doc = _model(key, schema)
				} catch (e) {
					doc = _model(key)
				}
				if (doc) {
					const i = this.models.findIndex(v => v.name === key)
					if (i !== -1) this.models[i].model = doc
					else this.models.push({ name: key, model: doc })
					await doc.insertMany(Object.entries(data[key]).map(v => ({ data: v })))
					listDoc.push({ name: key })
				}
			}
		}))

		try {
			const doc = await this.list.findById(this.lists._id)
			if (!doc) {
				await this.read()
				await this.write(data)
			} else {
				doc.data = listDoc
				await doc.save()
			}
			this.data = {}
		} catch (err) {
			console.error(err)
			throw err
		}
	}
}