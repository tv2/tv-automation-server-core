import { mousetrapHelper } from './mousetrapHelper'

(function (Mousetrap) {
	let _globalCallbacks = {}
	let _originalStopCallback = Mousetrap.prototype.stopCallback

	Mousetrap.prototype.stopCallback = function (e, element, combo, sequence) {
		let self = this

		if (self.paused) {
			return true
		}

		if (_globalCallbacks[combo] || _globalCallbacks[sequence]) {
			return false
		}

		return _originalStopCallback.call(self, e, element, combo)
	}

	Mousetrap.prototype.bindGlobal = function (keys, callback, action) {
		let self = this
		self.bind(keys, callback, action)

		if (keys instanceof Array) {
			for (let i = 0; i < keys.length; i++) {
				_globalCallbacks[keys[i]] = true
			}
			return
		}

		_globalCallbacks[keys] = true
	}

	Mousetrap.init()
})(Mousetrap);

(function (Mousetrap) {
	let _originalStopCallback = Mousetrap.prototype.stopCallback
	let _originalHandleKey = Mousetrap.prototype.handleKey

	let _shouldAbortNextCombo = false
	let _isEscapePressed = false

	const _downKeys: any[] = []

	Mousetrap.prototype.handleKey = function (character: string, _modifiers, e) {
		let self = this

		if (e.type === 'keydown' && _downKeys.indexOf(character) === -1) _downKeys.push(character)
		if (e.type === 'keyup') {
			const index = _downKeys.indexOf(character)
			if (index >= 0) {
				_downKeys.splice(_downKeys.indexOf(character), 1)
			}
		}

		return _originalHandleKey.apply(self, arguments)
	}

	Mousetrap.prototype.stopCallback = function (e, element, combo, sequence) {
		let self = this

		if (self.paused) {
			return true
		}

		if ((_shouldAbortNextCombo) && combo !== 'esc' && e.type === 'keyup') {
			_shouldAbortNextCombo = false
			return true
		}

		return _originalStopCallback.call(self, e, element, combo)
	}

	const escDown = function (e) {
		_isEscapePressed = true

		if (!e.repeat) {
			_shouldAbortNextCombo = (_downKeys.length > 1)
			_comboTriggered = false
		}

		e.preventDefault()
		e.stopPropagation()
	}

	const escUp = function (e) {
		_isEscapePressed = false

		if (_downKeys.length === 0) {
			_shouldAbortNextCombo = false
		}
	}

	Mousetrap.init()

	mousetrapHelper.bind('esc', escDown, 'keydown')
	mousetrapHelper.bind('esc', escUp, 'keyup')
})(Mousetrap)
