import type { Sorensen } from '@sofie-automation/sorensen'

/**
 * Maps lowercase codes to their PascalCase versions
 * Should include all possible codes defined by W3C
 * source: www.w3.org/TR/uievents-code (document.querySelectorAll('code[id^="code"]'))
 */
const CODES_BY_LOWERCASE = new Map(
	[
		'Backquote',
		'Backslash',
		'Backspace',
		'BracketLeft',
		'BracketRight',
		'Comma',
		'Digit0',
		'Digit1',
		'Digit2',
		'Digit3',
		'Digit4',
		'Digit5',
		'Digit6',
		'Digit7',
		'Digit8',
		'Digit9',
		'Equal',
		'IntlBackslash',
		'IntlRo',
		'IntlYen',
		'KeyA',
		'KeyB',
		'KeyC',
		'KeyD',
		'KeyE',
		'KeyF',
		'KeyG',
		'KeyH',
		'KeyI',
		'KeyJ',
		'KeyK',
		'KeyL',
		'KeyM',
		'KeyN',
		'KeyO',
		'KeyP',
		'KeyQ',
		'KeyR',
		'KeyS',
		'KeyT',
		'KeyU',
		'KeyV',
		'KeyW',
		'KeyX',
		'KeyY',
		'KeyZ',
		'Minus',
		'Period',
		'Quote',
		'Semicolon',
		'Slash',
		'AltLeft',
		'AltRight',
		'CapsLock',
		'ContextMenu',
		'ControlLeft',
		'ControlRight',
		'Enter',
		'MetaLeft',
		'MetaRight',
		'ShiftLeft',
		'ShiftRight',
		'Space',
		'Tab',
		'Convert',
		'KanaMode',
		'Lang1',
		'Lang2',
		'Lang3',
		'Lang4',
		'Lang5',
		'NonConvert',
		'Delete',
		'End',
		'Help',
		'Home',
		'Insert',
		'PageDown',
		'PageUp',
		'ArrowDown',
		'ArrowLeft',
		'ArrowRight',
		'ArrowUp',
		'NumLock',
		'Numpad0',
		'Numpad1',
		'Numpad2',
		'Numpad3',
		'Numpad4',
		'Numpad5',
		'Numpad6',
		'Numpad7',
		'Numpad8',
		'Numpad9',
		'NumpadAdd',
		'NumpadBackspace',
		'NumpadClear',
		'NumpadClearEntry',
		'NumpadComma',
		'NumpadDecimal',
		'NumpadDivide',
		'NumpadEnter',
		'NumpadEqual',
		'NumpadHash',
		'NumpadMemoryAdd',
		'NumpadMemoryClear',
		'NumpadMemoryRecall',
		'NumpadMemoryStore',
		'NumpadMemorySubtract',
		'NumpadMultiply',
		'NumpadParenLeft',
		'NumpadParenRight',
		'NumpadStar',
		'NumpadSubtract',
		'Escape',
		'F1',
		'F2',
		'F3',
		'F4',
		'F5',
		'F6',
		'F7',
		'F8',
		'F9',
		'F10',
		'F11',
		'F12',
		'Fn',
		'FnLock',
		'PrintScreen',
		'ScrollLock',
		'Pause',
		'BrowserBack',
		'BrowserFavorites',
		'BrowserForward',
		'BrowserHome',
		'BrowserRefresh',
		'BrowserSearch',
		'BrowserStop',
		'Eject',
		'LaunchApp1',
		'LaunchApp2',
		'LaunchMail',
		'MediaPlayPause',
		'MediaSelect',
		'MediaStop',
		'MediaTrackNext',
		'MediaTrackPrevious',
		'Power',
		'Sleep',
		'AudioVolumeDown',
		'AudioVolumeMute',
		'AudioVolumeUp',
		'WakeUp',
		'Hyper',
		'Super',
		'Turbo',
		'Abort',
		'Resume',
		'Suspend',
		'Again',
		'Copy',
		'Cut',
		'Find',
		'Open',
		'Paste',
		'Props',
		'Select',
		'Undo',
		'Hiragana',
		'Katakana',
		'Unidentified',
	].map((code) => [code.toLowerCase(), code])
)

/**
 * Turns user-supplied code into a correct PascalCased code
 */
function toPascalCase(code: string): string {
	return CODES_BY_LOWERCASE.get(code.toLowerCase()) ?? code.charAt(0).toUpperCase() + code.slice(1)
}

export function codesToKeyLabels(keys: string, sorensen: Sorensen) {
	return keys
		.split(/\s+/gi)
		.map((note) =>
			note
				.split(/\+/gi)
				.map((code) => toPascalCase(sorensen.getKeyForCode(code)))
				.join('+')
		)
		.join(' ')
}

export function keyLabelsToCodes(labels: string, sorensen: Sorensen) {
	return labels
		.split(/\s+/gi)
		.map((note) => {
			const keys = note.split(/(?<!\+)\+/gi)

			return keys.map((key) => toPascalCase(sorensen.getCodeForKey(key)?.replace(/Intl/, '') ?? key)).join('+')
		})
		.join(' ')
}

export function getFinalKey(keys: string) {
	const individualKeys = keys.split(/\+/gi)
	return individualKeys[individualKeys.length - 1]
}
