import { loadLogin } from '/index.js'
import {
	getUser,
	getToken } from '/js-modules/myAuth.js'
import {
	handleServerError,
	get,
	post
} from '/js-modules/myUtilities.js'

export {
	CommentSection
}

class Comment extends HTMLElement {
	constructor({ commentJSON=undefined }) {
		super()
		if(!commentJSON) throw new Error('Missing commentJSON value')
		this.attachShadow({ mode: 'open' })
		this._comment = encodeURIComponent(JSON.stringify(commentJSON))
		this.shadowRoot.appendChild(document.importNode(document.getElementById('/html-templates/general/comment.html'.replace(/[^A-Za-z0-9]/g, '')).import.querySelector('template').content, true).getElementById('comment'))
		this.elementDate.textContent = (new Date(this.commentJSON.dateCreated)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
		this.elementText.textContent = this.commentJSON.text
		if(this.commentJSON.textEditDate) {
			this.elementTextEditDate.textContent = 'Edited: '+(new Date(this.commentJSON.textEditDate)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
			this.elementTextEditDate.classList.remove('hidden')
		}
		this.elementUpVoteCount.textContent = this.commentJSON.upVoteAccountIDs.length
		this.elementDownVoteCount.textContent = this.commentJSON.downVoteAccountIDs.length
		this.elementReplyFormInputOrLoginLink.addEventListener('click', (event) => {
			loadLogin()
		})
		if(parseInt(this.commentJSON.children.length) === 0) {
			this.elementRepliesToggle.classList.add('hidden')
		}
		if(!this.commentJSON.removed) {
			if(this.commentJSON.account) {
				// COMMENT FROM USER
				this.elementName.textContent = (this.commentJSON.account.nameFirst+' '+this.commentJSON.account.nameLast).toUpperCase()
				if(this.commentJSON.account.facebookProfileID) {
					// COMMENT FROM USER VIA FACEBOOK
					this.elementProfilePic.src = 'http://graph.facebook.com/'+this.commentJSON.account.facebookProfileID+'/picture?type=large'
				}
				else if(this.commentJSON.account.googleProfileID) {
					// COMMENT FROM USER VIA GOOGLE
					const request = new XMLHttpRequest()
					request.onload = () => {
						if(request.status === 200) {
							const response = JSON.parse(request.response)
							this.elementProfilePic.src = response.entry.gphoto$thumbnail.$t
						}
					}
					request.onerror = () => {
					}
					request.open('GET', 'http://picasaweb.google.com/data/entry/api/user/'+this.commentJSON.account.googleProfileID+'?alt=json')
					request.send()
				}
				else {
					// COMMENT FROM USER VIA LOCAL
					this.elementProfilePic.src = '/assets/images/profile-pic-default.jpg'
				}
			}
			else {
				// COMMENT FROM VISITOR
				this.elementProfilePic.src = '/assets/images/profile-pic-default.jpg'
				this.elementName.textContent = (this.commentJSON.nameFirst+' '+this.commentJSON.nameLast).toUpperCase()
			}
		}
		this._drawUi()
		window.addEventListener('login-event', (e) => {
			this._drawUi()
		})
		window.addEventListener('logout-event', (e) => {
			this._drawUi()
		})
		// Attach Listeners....
		this.elementRepliesToggle.addEventListener('click', (e) => {
			this.elementRepliesToggle.classList.toggle('active')
			this.elementRepliesSection.classList.toggle('hidden')
			// this.elementLoadNewButton.classList.toggle('hidden') // Makes comments look ugly... should be put on a timer or streamed
			this.elementLoadOldButton.classList.toggle('hidden')
			// If replies are empty... AND replies are active
			if(this.elementRepliesToggle.classList.contains('active') && this.childElementCount === 0) {
				// Query for 1st batch of child comments
				this._loadOldReplies().catch(handleServerError)
			}
		})
		this.elementReplyToggle.addEventListener('click', (e) => {
			this.elementReplyToggle.classList.toggle('active')
			this.elementReplyForm.classList.toggle('hidden')
			if(this.elementReplyFormInputText.isEqualNode(document.activeElement)) {
				this.elementReplyFormInputText.blur()
			}
			else if(this.parentElement instanceof Comment){
				// This is causing some weird issues... when focused the page is either refreshing or css is being redrawn/applied (including all animations).
				this.elementReplyFormInputText.focus()
			}
		})
		this.elementRemoveButton.addEventListener('click', (e) => {
			if(getToken())
				this._remove().catch(handleServerError)
			else
				loadLogin()
		})
		this.elementTextEditToggle.addEventListener('click', (e) => {
			this.elementTextEditToggle.classList.toggle('active')
			if(this.elementTextEditForm.classList.contains('hidden')) {
				this.elementTextEdit.textContent = this.elementText.textContent
				this.elementText.classList.add('hidden')
				this.elementTextEditForm.classList.remove('hidden')
				this.elementTextEdit.focus()
			}
			else {
				this.elementTextEdit.textContent = ''
				this.elementText.classList.remove('hidden')
				this.elementTextEditForm.classList.add('hidden')
			}
		})
		this.elementTextEditSubmit.addEventListener('click', (e) => {
			e.preventDefault()
			this._edit().catch(handleServerError)
			// Send Update to DB
			// Click Edit Cancel
		})
		this.elementFlagButton.addEventListener('click', (e) => {
			if(getToken())
				this._flag().catch(handleServerError)
			else
				loadLogin()
		})
		this.elementUpVoteButton.addEventListener('click', (e) => {
			if(getToken())
				this._upVote().catch(handleServerError)
			else
				loadLogin()
		})
		this.elementDownVoteButton.addEventListener('click', (e) => {
			if(getToken())
				this._downVote().catch(handleServerError)
			else
				loadLogin()
		})
		this.elementLoadNewButton.addEventListener('click', (e) => {
			this._loadNewReplies().catch(handleServerError)
		})
		this.elementLoadOldButton.addEventListener('click', (e) => {
			this._loadOldReplies().catch(handleServerError)
		})
		this.elementReplyForm.addEventListener('submit', (e) => {
			e.preventDefault()
			this._create().catch(handleServerError)
		})
	}
	static get observedAttributes() { return [ ] }
	// Respond to attribute changes...
	attributeChangedCallback(attr, oldValue, newValue, namespace) {
	}
	disconnectedCallback() {
		// super.disconnectedCallback()
	}
	// Called when an attribute is changed, appended, removed, or replaced on the element
	connectedCallback() {
		// super.connectedCallback()
	}
	// Called when the element is adopted into a new document
	adoptedCallback(oldDocument, newDocument) {
		super.adoptedCallback(oldDocument, newDocument)
	}
	get commentJSON() {
		return JSON.parse(decodeURIComponent(this._comment))
	}
	get elementContent() { return this.shadowRoot.querySelector('#comment > main') }
	get elementProfilePic() { return this.shadowRoot.getElementById('profile-pic') }
	get elementName() { return this.shadowRoot.getElementById('name') }
	get elementDate() { return this.shadowRoot.getElementById('date') }
	get elementText() { return this.shadowRoot.getElementById('text') }
	get elementTextEdit() { return this.shadowRoot.getElementById('text-edit') }
	get elementTextEditDate() { return this.shadowRoot.getElementById('text-edit-date') }
	get elementTextEditForm() { return this.shadowRoot.getElementById('text-edit-form') }
	get elementTextEditSubmit() { return this.shadowRoot.getElementById('text-edit-submit') }
	get elementTextEditToggle() { return this.shadowRoot.getElementById('text-edit-toggle') }
	get elementRepliesToggle() { return this.shadowRoot.getElementById('replies-toggle') }
	get elementActions() { return this.shadowRoot.getElementById('actions') }
	get elementReplyToggle() { return this.shadowRoot.getElementById('reply-toggle') }
	get elementUpVoteCount() { return this.shadowRoot.getElementById('up-vote-count') }
	get elementUpVoteButton() { return this.shadowRoot.getElementById('up-vote-button') }
	get elementDownVoteCount() { return this.shadowRoot.getElementById('down-vote-count') }
	get elementDownVoteButton() { return this.shadowRoot.getElementById('down-vote-button') }
	get elementRemoveButton() { return this.shadowRoot.getElementById('remove-button') }
	get elementFlagButton() { return this.shadowRoot.getElementById('flag-button') }
	get elementRepliesSection() { return this.shadowRoot.getElementById('replies-section') }
	get elementLoadNewButton() { return this.shadowRoot.getElementById('load-new-button') }
	get elementReplies() { return this.shadowRoot.getElementById('replies')  }
	get elementReplyForm() {return this.shadowRoot.getElementById('reply-form') }
	get elementReplyFormInputText() { return this.shadowRoot.querySelector('#reply-form .text') }
	get elementReplyFormInputEmail() { return this.shadowRoot.querySelector('#reply-form .email') }
	get elementReplyFormInputOrLoginLink() { return this.shadowRoot.querySelector('#reply-form .or-login-link')}
	get elementReplyFormInputNameFirst() { return this.shadowRoot.querySelector('#reply-form .name-first') }
	get elementReplyFormInputNameLast() { return this.shadowRoot.querySelector('#reply-form .name-last') }
	get elementReplyFormSectionEmail() { return this.shadowRoot.getElementById('email-input-section') }
	get elementReplyFormSectionNameFirst() { return this.shadowRoot.getElementById('name-first-input-section') }
	get elementReplyFormSectionNameLast() { return this.shadowRoot.getElementById('name-last-input-section') }
	get elementLoadOldButton() { return this.shadowRoot.getElementById('load-old-button') }
	async _loadNewReplies() {
		var queryString = ''
		queryString += 'entity='+encodeURIComponent(this.commentJSON.entity)
		if(this.commentJSON._id)
			queryString += '&parent='+encodeURIComponent(this.commentJSON._id)
		if(this.firstElementChild)
			queryString += '&start='+encodeURIComponent(this.firstElementChild.commentJSON._id)
		queryString += '&sortOrder='+encodeURIComponent('1')
		const response = await get({ route: '/comments/read?'+queryString })
		const comments = response.data
		for(var i = 0; i < comments.length; i++) {
			const newComment = new Comment({ commentJSON: comments[i] })
			newComment.slot = 'reply-slot'
			this.prepend(newComment)
		}
	}
	async _loadOldReplies() {
		var queryString = ''
		queryString += 'entity='+encodeURIComponent(this.commentJSON.entity)
		if(this.commentJSON._id)
			queryString += '&parent='+encodeURIComponent(this.commentJSON._id)
		if(this.elementRepliesSection.dataset.start)
			queryString += '&start='+encodeURIComponent(this.elementRepliesSection.dataset.start)
		queryString += '&pageSize='+encodeURIComponent('5')
		queryString += '&sortOrder='+encodeURIComponent('-1')
		queryString += '&pageNum='+encodeURIComponent(parseInt(this.elementRepliesSection.dataset.pageNum) || 1)
		queryString += '&skipOnPage='+encodeURIComponent(parseInt(this.elementRepliesSection.dataset.skipOnPage) || 0)
		const response = await get({ route: '/comments/read?'+queryString })
		var comments = response.data
		if(this.elementRepliesSection.dataset.start === 'newest' && comments.length > 0) {
			this.elementRepliesSection.dataset.start = comments[0]._id
		}
		var lastSkipOnPage = 0
		if(this.elementRepliesSection.dataset.skipOnPage)
			lastSkipOnPage = parseInt(this.elementRepliesSection.dataset.skipOnPage)
		this.elementRepliesSection.dataset.skipOnPage = ((comments.length + lastSkipOnPage) < 5) ? lastSkipOnPage + comments.length : 0
		var lastPageNum =  1
		if(this.elementRepliesSection.dataset.pageNum)
			lastPageNum = parseInt(this.elementRepliesSection.dataset.pageNum)
		this.elementRepliesSection.dataset.pageNum = ((comments.length + lastSkipOnPage) < 5) ? lastPageNum : lastPageNum+1
		// If returned partially fully page or child elements greaterthan or equal to expected childCount on the element
		if(comments.length < 5) {
			this.elementLoadOldButton.classList.add('hidden')
		}
		for(var i = 0; i < comments.length; i++) {
			const newComment = new Comment({ commentJSON: comments[i] })
			newComment.slot = 'reply-slot'
			this.appendChild(newComment)
		}
	}
	async _create() {
		const response = await post({
			route: '/comments/create',
			body: {
				entity: this.commentJSON.entity,
				parent: this.commentJSON._id,
				text: this.elementReplyFormInputText.value,
				email: this.elementReplyFormInputEmail.value,
				nameFirst: this.elementReplyFormInputNameFirst.value,
				nameLast: this.elementReplyFormInputNameLast.value
			}
		})
		if(this.elementRepliesToggle.classList.contains('hidden') && this.parentElement instanceof Comment) {
			this.elementRepliesToggle.classList.remove('hidden')
		}
		if(this.childElementCount === 0) {
			if(!this.elementRepliesToggle.classList.contains('active')) {
				this.elementRepliesToggle.click()
			}
			else {
				this.elementLoadOldButton.click()
			}
		}
		else {
			this.elementLoadNewButton.click()
		}
		if(this.parentElement instanceof Comment)
			this.elementReplyToggle.click()
		if(!getToken())
			await this._silentRegistrationRequest()
		this.elementReplyForm.reset()
	}
	async _remove() {
		const response = await post({
			route: '/comments/mark-removed',
			body: {
				entity: this.commentJSON.entity,
				parent: this.commentJSON._id,
				text: this.elementReplyFormInputText.value,
				email: this.elementReplyFormInputEmail.value,
				nameFirst: this.elementReplyFormInputNameFirst.value,
				nameLast: this.elementReplyFormInputNameLast.value
			}
		})
		this._drawRemoved()
	}
	async _silentRegistrationRequest() {
		const response = await post({
			route: '/auth/email/silent-registration/request',
			body: {
				email: this.elementReplyFormInputEmail.value,
				nameFirst: this.elementReplyFormInputNameFirst.value,
				nameLast: this.elementReplyFormInputNameLast.value
			}
		})
	}
	async _jumpToComment(commentAncestors) {
		if(commentAncestors && commentAncestors.length === 1 && commentAncestors[0] === this.commentJSON._id) {
			alert('Found comment, jump to this comment on page!')
			return true
		}
		if(this.commentJSON._id) // Don't shift if root comment, which has null _id...
			commentAncestors.shift()
		var lastCountChildElements = 0
		while(true) {
			await this._loadOldReplies()
			if(lastCountChildElements === this.childElementCount)
				break /* No more child comments */
			for(var i = lastCountChildElements; i < this.childElementCount; i++) {
				if(await this.children[i]._jumpToComment(commentAncestors)) {
					alert('Reveal Child Comments')
					return true
				}
			}
			lastCountChildElements = this.childElementCount
		}
		return false
	}
	async _flag() {
		const response = await post({
			route: '/comments/flag',
			body: {
				_id: this.commentJSON._id || null
			}
		})
		this._drawRemoved()
		this.elementFlagButton.classList.add('disabled')
	}
	async _upVote() {
		const response = await post({
			route: '/comments/up-vote',
			body: {
				_id: this.commentJSON._id || null
			}
		})
		this.elementUpVoteCount.textContent = (parseInt(this.elementUpVoteCount.textContent)+1)
		this.elementUpVoteButton.classList.add('disabled')
	}
	async _downVote() {
		const response = await post({
			route: '/comments/down-vote',
			body: {
				_id: this.commentJSON._id || null
			}
		})
		this.elementDownVoteCount.textContent = (parseInt(this.elementDownVoteCount.textContent)+1)
		this.elementDownVoteButton.classList.add('disabled')
	}
	async _edit() {
		const response = await post({
			route: '/comments/edit',
			body: {
				_id: this.commentJSON._id || null,
				text: this.elementTextEdit.textContent
			}
		})
		this.elementText.textContent = this.elementTextEdit.textContent
		this.elementTextEditToggle.click()
		this.elementTextEditDate.textContent = 'Edited: '+(new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
		this.elementTextEditDate.classList.remove('hidden')
	}
	_drawRemoved() {
		this.elementContent.classList.add('hidden')
		this.elementName.textContent = '~ Removed ~'
		this.elementActions.classList.add('hidden')
		if(!this.elementTextEditForm.classList.contains('hidden'))
			this.elementTextEditToggle.click()
	}
	_drawUiAnonymous() {
		this.elementProfilePic.classList.remove('hidden')
		this.elementReplyFormSectionEmail.classList.remove('hidden')
		this.elementReplyFormSectionNameFirst.classList.remove('hidden')
		this.elementReplyFormSectionNameLast.classList.remove('hidden')
		this.elementReplyFormInputEmail.setAttribute('required', '')
		this.elementReplyFormInputNameFirst.setAttribute('required', '')
		this.elementReplyFormInputNameLast.setAttribute('required', '')
		if(this.parentElement instanceof Comment)
			this.elementActions.classList.remove('hidden')
		this.elementRemoveButton.classList.add('hidden')
		this.elementTextEditToggle.classList.add('hidden')
	}
	_drawUiAuthenticated() {
		// Is Logged In
		this.elementProfilePic.classList.remove('hidden')
		this.elementReplyFormSectionEmail.classList.add('hidden')
		this.elementReplyFormSectionNameFirst.classList.add('hidden')
		this.elementReplyFormSectionNameLast.classList.add('hidden')
		this.elementReplyFormSectionEmail.value = ''
		this.elementReplyFormSectionNameFirst.value = ''
		this.elementReplyFormSectionNameLast.value = ''
		this.elementReplyFormInputEmail.removeAttribute('required')
		this.elementReplyFormInputNameFirst.removeAttribute('required')
		this.elementReplyFormInputNameLast.removeAttribute('required')
		if(getUser()._id == this.commentJSON.accountID) {
			// Comment Owner
			this.elementRemoveButton.classList.remove('hidden')
			if(this.commentJSON.children.length <= 0)
				this.elementTextEditToggle.classList.remove('hidden')
			this.elementDownVoteButton.classList.add('disabled')
			this.elementUpVoteButton.classList.add('disabled')
			this.elementFlagButton.classList.add('disabled')
		}
		else {
			// Not Comment Owner
			this.elementRemoveButton.classList.add('hidden')
			this.elementTextEditToggle.classList.add('hidden')
			if(this.commentJSON.upVoteAccountIDs.includes(getUser()._id))
				this.elementUpVoteButton.classList.add('disabled')
			else
				this.elementUpVoteButton.classList.remove('disabled')
			if(this.commentJSON.downVoteAccountIDs.includes(getUser()._id))
				this.elementDownVoteButton.classList.add('disabled')
			else
				this.elementDownVoteButton.classList.remove('disabled')
			if(this.commentJSON.flags.includes(getUser()._id))
				this.elementFlagButton.classList.add('disabled')
			else
				this.elementFlagButton.classList.remove('disabled')
		}
	}
	_drawRoot() {

	}
	/* Draw U.I. according to type, auth, and data */
	_drawUi() {
		this.elementReplyForm.reset()
		this.elementTextEditForm.reset()
		if(this.commentJSON.removed)
			this._drawRemoved()
		else if(getToken())
			this._drawUiAuthenticated()
		else
			this._drawUiAnonymous()
	}
}
if(!window.customElements.get('my-comment')) {
	window.customElements.define('my-comment', Comment)
}
class CommentSection {
	constructor(entity) {
		entity = (entity) ? entity : '/articles/'
		const commentSection = document.getElementById('comment-section') // Find Comment Section Container
		var rootCommentClass = new Comment({
			commentJSON: {
				_id: null,
				accountID: null,
				entity: entity,
				parent: null,
				upVoteAccountIDs: [],
				downVoteAccountIDs: [],
				removed: false,
				text: 'Comments',
				facebookProfileID: null,
				flags: [],
				children: [],
				account: {
					nameFirst: '~First Name~',
					nameLast: '~Last Name~',
					facebookProfileID: undefined
				},
				dateCreated: '~Date Created~'
			}
		})
		rootCommentClass.shadowRoot.querySelector('header').classList.add('hidden')
		rootCommentClass.shadowRoot.querySelector('main').classList.add('hidden')
		rootCommentClass.elementActions.classList.add('hidden')
		rootCommentClass.elementRepliesToggle.classList.remove('hidden')
		rootCommentClass.elementActions.style.marginLeft = '0px'
		rootCommentClass.elementRepliesSection.style.marginLeft = '0px'
		rootCommentClass.elementRepliesToggle.classList.add('hidden')
		rootCommentClass.elementReplyForm.style.marginLeft = '0px'
		// rootCommentClass.elementReplyForm.style.display = 'block !important'
		rootCommentClass.elementReplies.style.marginLeft = '0px'
		rootCommentClass.elementLoadOldButton.style.marginLeft = '0px'
		// Any click event inside the comment section
		if(commentSection.firstElementChild) {
			commentSection.firstElementChild.replaceWith(rootCommentClass)
		}
		else {
			commentSection.appendChild(rootCommentClass)
		}
		rootCommentClass.elementReplyToggle.click()
		rootCommentClass.elementRepliesToggle.click()
		// Jump to the associated comment
		if(window.location.search) {
			let params = new URLSearchParams(window.location.search.substring(1)); // substring(1) to drop the leading "?"
			let commentJump = params.get("comment-jump")
			let commentAncestors = commentJump.split(',')
			rootCommentClass._jumpToComment(commentAncestors).catch(handleServerError)
		}
	}
}