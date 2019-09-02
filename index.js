const fs = require('fs')
const EventEmitter = require('events')
const rp = require('request-promise')

class FileWatcher extends EventEmitter{
	constructor(filename) {
		super()
		this.filename = filename
		this.position = 0
		this.chunkSize = 16 * 1024
		this.buffer = Buffer.alloc(this.chunkSize)
		this.inProcess = false
		this.fd = fs.openSync(this.filename)
		this.position = fs.fstatSync(this.fd).size
		this.fsWatcher = fs.watch(this.filename)
		this.fsWatcher.on('change', this.handleChange.bind(this))
	}

	handleChange(eventType, filename) {
		if(this.inProcess) {
			return
		}
		this.inProcess = true
		const bytesRead = fs.readSync(this.fd, this.buffer, 0, this.chunkSize, this.position)
		this.position += bytesRead
		this.emit('append', this.buffer.slice(0, bytesRead))
		if(bytesRead === this.chunkSize) {
			process.nextTick(this.handleChange.bind(this, eventType, filename))
		}
		this.inProcess = false
	}
}

class ErrorHandler{
	constructor() {
		this.fileWatcher = []
		this.fileWatcher.push(new FileWatcher('./aa.log'))
		this.fileWatcher.forEach(watcher => {
			watcher.on('append', this.handleFileAppend.bind(this))
		})
	}

	handleFileAppend(buffer) {
		console.log(buffer.toString())
	}

	sendWarning(msg) {
		console.log(msg)
	}
}

new ErrorHandler()