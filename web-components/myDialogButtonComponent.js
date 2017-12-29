export { MyDialogButtonComponent }

class MyDialogButtonComponent extends HTMLElement {
	// Add Listeners, innerHTML, styling, etc...
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		this._refreshShadowRoot()
	}
	static get observedAttributes() { return [ 'opened' ] }
	// Respond to attribute changes...
	attributeChangedCallback(name, oldValue, newValue, namespace) {
		// super.attributeChangedCallback(attr, oldValue, newValue, namespace);
		if(name === 'opened') {
			const dialog = this.shadowRoot.getElementById('dialog')
			if(this.opened) {
				if(!dialog.open) {
					dialog.showModal()
				}
			}
			else {
				if(dialog.open) {
					dialog.close()
				}
			}
		}
	}
	// Removed from a document
	disconnectedCallback() {
		// super.disconnectedCallback();
	}
	// Called when an attribute is changed, appended, removed, or replaced on the element
	connectedCallback() {
		// super.connectedCallback();
		this._refreshShadowRoot()
	}
	// Called when the element is adopted into a new document
	adoptedCallback(oldDocument, newDocument) {
		super.adoptedCallback(oldDocument, newDocument)
	}
	get opened() {
		return this.hasAttribute('opened')
	}
	set opened(val) {
		if(val) {
			this.setAttribute('opened', '')
		}
		else {
			this.removeAttribute('opened')
		}
	}
	toggleDialog() {
		if(this.opened) {
			this.opened = false
		}
		else {
			this.opened = true
		}
	}
	_refreshShadowRoot() {
		var component = this
		this.shadowRoot.innerHTML = `
		<slot id='open' name='open'><button>Open</button></slot>
		<dialog id='dialog'>
			<slot id='content' name='content'><p>Placeholder Content</p></slot>
			<button id='close'>Close</button>
		</dialog>
		<style>
		:host {
			position: relative;
		}
		#open::slotted(*:hover) {
			cursor: pointer;
		}
		#close {
			position: absolute;
			top: 0px;
			right: 0px;
			display: block;
		}
		#close:hover {
			cursor: pointer;
		}
		#dialog {
			max-width: 90%;
			max-height: 90%;
			color: black;
			top: 0%;
		}
		</style>
		`
		const content = component.shadowRoot.getElementById('content')
		const close = component.shadowRoot.getElementById('close')
		const open = component.shadowRoot.getElementById('open')
		open.addEventListener('click', function(event) {
			component.opened = true
		})
		close.addEventListener('click', function(event) {
			component.opened = false
		})
	}
}
window.customElements.define('my-dialog-button', MyDialogButtonComponent)