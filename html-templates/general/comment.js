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
	constructor({ commentJSON=(()=>{throw new Error('Missing commentJSON')})() }={}) {
		super()
		this.attachShadow({ mode: 'open' })
		this._comment = encodeURIComponent(JSON.stringify(commentJSON))
		this.shadowRoot.appendChild(document.importNode(document.getElementById('/html-templates/general/comment.html'.replace(/[^A-Za-z0-9]/g, '')).import.querySelector('template').content, true).getElementById('comment'))
		this.elementDate.textContent = (new Date(this.commentJSON.dateCreated)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
		this.elementText.textContent = this.commentJSON.text
		this.elementNotifyOnReply.checked = (this.commentJSON.notifyOnReply) ? true : false
		if(this.commentJSON.textEditDate) {
			this.elementEditDate.textContent = 'Edited: '+(new Date(this.commentJSON.textEditDate)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
			this.elementEditDate.classList.remove('hidden')
		}
		this.elementUpVoteCount.textContent = this.commentJSON.upVoteAccountIDs.length
		this.elementDownVoteCount.textContent = this.commentJSON.downVoteAccountIDs.length
		this.elementReplyFormInputOrLoginLink.addEventListener('click', (/*event*/) => {
			loadLogin()
		})
		this.elementReplyFormInputOrSignupLink.addEventListener('click', (/*event*/) => {
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
		window.addEventListener('login-event', (/*e*/) => {
			this._drawUi()
		})
		window.addEventListener('logout-event', (/*e*/) => {
			this._drawUi()
		})
		// Attach Listeners....
		this.elementRepliesToggle.addEventListener('click', (/*e*/) => {
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
		this.elementNotifyOnReply.addEventListener('click', (/*e*/) => {
			this._notifyOnReply().catch(handleServerError)
		})
		this.elementReplyToggle.addEventListener('click', (/*e*/) => {
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
		this.elementRemoveButton.addEventListener('click', (/*e*/) => {
			this._remove().catch(handleServerError)
		})
		this.elementEditToggle.addEventListener('click', (/*e*/) => {
			this.elementEditToggle.classList.toggle('active')
			if(this.elementEditForm.classList.contains('hidden')) {
				this.elementEditFormInputText.textContent = this.elementText.textContent
				this.elementText.classList.add('hidden')
				this.elementEditForm.classList.remove('hidden')
				this.elementEditFormInputText.focus()
			}
			else {
				this.elementEditFormInputText.textContent = ''
				this.elementText.classList.remove('hidden')
				this.elementEditForm.classList.add('hidden')
			}
		})
		this.elementEditFormSubmit.addEventListener('click', (e) => {
			e.preventDefault()
			this._edit()
				.catch(handleServerError)
		})
		this.elementLinkButton.addEventListener('click', (/*e*/) => {
			document.execCommand('copy', false)
		})
		this.elementLinkButton.addEventListener('copy', (e) => {
			e.preventDefault()
			if (e.clipboardData) {
				var link = window.location.origin+window.location.pathname+'?comment-jump='
				if(this.commentJSON.ancestors.length > 0)
					link += this.commentJSON.ancestors.toString()+','+this.commentJSON._id
				else
					link += this.commentJSON._id
				e.clipboardData.setData('text/plain', link)
			}
		})
		this.elementFlagButton.addEventListener('click', (/*e*/) => {
			this._flag().catch(handleServerError)
		})
		this.elementUpVoteButton.addEventListener('click', (/*e*/) => {
			this._upVote().catch(handleServerError)
		})
		this.elementDownVoteButton.addEventListener('click', (/*e*/) => {
			this._downVote().catch(handleServerError)
		})
		this.elementLoadNewButton.addEventListener('click', (/*e*/) => {
			this._loadNewReplies().catch(handleServerError)
		})
		this.elementLoadOldButton.addEventListener('click', (/*e*/) => {
			this._loadOldReplies().catch(handleServerError)
		})
		this.elementReplyForm.addEventListener('submit', (e) => {
			e.preventDefault()
			this._create()
				.catch(handleServerError)
		})
	}
	static get observedAttributes() { return [ ] }
	// Respond to attribute changes...
	attributeChangedCallback(/*attr, oldValue, newValue, namespace*/) {
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
	get elementEditForm() { return this.shadowRoot.getElementById('text-edit-form') }
	get elementEditFormInputText() { return this.shadowRoot.getElementById('text-edit') }
	get elementNotifyOnReply() { return this.shadowRoot.getElementById('notify-on-reply-edit') }
	get elementEditDate() { return this.shadowRoot.getElementById('text-edit-date') }
	get elementEditFormSubmit() { return this.shadowRoot.getElementById('text-edit-submit') }
	get elementEditToggle() { return this.shadowRoot.getElementById('text-edit-toggle') }
	get elementRepliesToggle() { return this.shadowRoot.getElementById('replies-toggle') }
	get elementActions() { return this.shadowRoot.getElementById('actions') }
	get elementReplyToggle() { return this.shadowRoot.getElementById('reply-toggle') }
	get elementLinkButton() { return this.shadowRoot.getElementById('link') }
	get elementUpVoteCount() { return this.shadowRoot.getElementById('up-vote-count') }
	get elementUpVoteButton() { return this.shadowRoot.getElementById('up-vote-button') }
	get elementDownVoteCount() { return this.shadowRoot.getElementById('down-vote-count') }
	get elementDownVoteButton() { return this.shadowRoot.getElementById('down-vote-button') }
	get elementFlagButton() { return this.shadowRoot.getElementById('flag-button') }
	get elementOwnerActions() { return this.shadowRoot.getElementById('owner-actions') }
	get elementRemoveButton() { return this.shadowRoot.getElementById('remove-button') }
	get elementRepliesSection() { return this.shadowRoot.getElementById('replies-section') }
	get elementLoadNewButton() { return this.shadowRoot.getElementById('load-new-button') }
	get elementReplies() { return this.shadowRoot.getElementById('replies') }
	get elementReplyForm() {return this.shadowRoot.getElementById('reply-form') }
	get elementReplyFormInputText() { return this.shadowRoot.querySelector('#reply-form .text') }
	get elementReplyFormInputEmail() { return this.shadowRoot.querySelector('#reply-form .email') }
	get elementReplyFormInputOrLoginLink() { return this.shadowRoot.querySelector('#reply-form .or-login-link') }
	get elementReplyFormInputOrSignupLink() { return this.shadowRoot.querySelector('#reply-form .or-signup-link') }
	get elementReplyFormInputNameFirst() { return this.shadowRoot.querySelector('#reply-form .name-first') }
	get elementReplyFormInputNameLast() { return this.shadowRoot.querySelector('#reply-form .name-last') }
	get elementReplyFormInputNotifyOnReply() { return this.shadowRoot.querySelector('#reply-form .notify-on-reply') }
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
		if(this.elementRepliesSection.dataset.start === 'newest' && response.data.length > 0) {
			this.elementRepliesSection.dataset.start = response.data[0]._id
		}
		var lastSkipOnPage = 0
		if(this.elementRepliesSection.dataset.skipOnPage)
			lastSkipOnPage = parseInt(this.elementRepliesSection.dataset.skipOnPage)
		this.elementRepliesSection.dataset.skipOnPage = ((response.data.length + lastSkipOnPage) < 5) ? lastSkipOnPage + response.data.length : 0
		var lastPageNum =  1
		if(this.elementRepliesSection.dataset.pageNum)
			lastPageNum = parseInt(this.elementRepliesSection.dataset.pageNum)
		this.elementRepliesSection.dataset.pageNum = ((response.data.length + lastSkipOnPage) < 5) ? lastPageNum : lastPageNum+1
		// If returned partially fully page or child elements greaterthan or equal to expected childCount on the element
		if(response.data.length < 5) {
			this.elementLoadOldButton.classList.add('hidden')
		}
		for(var i = 0; i < response.data.length; i++) {
			const newComment = new Comment({ commentJSON: response.data[i] })
			newComment.slot = 'reply-slot'
			this.appendChild(newComment)
		}
	}
	async _create() {
		await post({
			route: '/comments/create',
			body: {
				entity: this.commentJSON.entity,
				parent: this.commentJSON._id || undefined,
				text: this.elementReplyFormInputText.value,
				email: this.elementReplyFormInputEmail.value || undefined,
				nameFirst: this.elementReplyFormInputNameFirst.value || undefined,
				nameLast: this.elementReplyFormInputNameLast.value || undefined,
				notifyOnReply: this.elementReplyFormInputNotifyOnReply.checked
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
		this.elementReplyForm.reset()
	}
	async _remove() {
		await post({
			route: '/comments/mark-removed',
			body: {
				_id: this.commentJSON._id || undefined
			}
		})
		this._drawRemoved()
	}
	/* A function that takes a list of comment IDs,
	and recursively scans all child comments to find the jump comment to set focus to. */
	async _jumpToComment(commentAncestors) {
		// This is the focus comment!
		if(commentAncestors.length === 1 && this.commentJSON._id === commentAncestors[0]) {
			this.scrollIntoView({behavior: 'smooth', block: 'end', inline: 'nearest'})
			return true
		}
		// This comment is an ancestors of the focus comment!
		if(this.commentJSON._id === commentAncestors[0] || !this.commentJSON._id) {
			this.elementRepliesToggle.classList.add('active')
			this.elementRepliesSection.classList.remove('hidden')
			// Continue searching children!
			var childrenChecked = 0
			var previousChildElementCount = -1
			while((childrenChecked < this.commentJSON.children.length || !this.commentJSON._id)
				&& previousChildElementCount < this.childElementCount) {
				previousChildElementCount = this.childElementCount
				for(var i = childrenChecked; i < this.childElementCount; i++) {
					const commentAncestorsNext = (this.commentJSON._id) ? commentAncestors.slice(1) : commentAncestors.slice(0)
					if(await this.children[i]._jumpToComment(commentAncestorsNext))
						return true
					childrenChecked += 1
				}
				await this._loadOldReplies()
			}
		}
		// This comment is not related to the linked comment
		return false
	}
	async _flag() {
		await post({
			route: '/comments/flag',
			body: {
				_id: this.commentJSON._id || undefined
			}
		})
		this._drawRemoved()
		this.elementFlagButton.classList.add('disabled')
	}
	async _upVote() {
		await post({
			route: '/comments/up-vote',
			body: {
				_id: this.commentJSON._id || undefined
			}
		})
		this.elementUpVoteCount.textContent = (parseInt(this.elementUpVoteCount.textContent)+1)
		this.elementUpVoteButton.classList.add('disabled')
	}
	async _downVote() {
		await post({
			route: '/comments/down-vote',
			body: {
				_id: this.commentJSON._id || undefined
			}
		})
		this.elementDownVoteCount.textContent = (parseInt(this.elementDownVoteCount.textContent)+1)
		this.elementDownVoteButton.classList.add('disabled')
	}
	async _edit() {
		await post({
			route: '/comments/edit',
			body: {
				_id: this.commentJSON._id || undefined,
				text: this.elementEditFormInputText.textContent
			}
		})
		this.elementText.textContent = this.elementEditFormInputText.textContent
		this.elementEditToggle.click()
		this.elementEditDate.textContent = 'Edited: '+(new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
		this.elementEditDate.classList.remove('hidden')
	}
	async _notifyOnReply() {
		await post({
			route: '/comments/notify-on-reply',
			body: {
				_id: this.commentJSON._id || undefined,
				notifyOnReply: this.elementNotifyOnReply.checked
			}
		})
	}
	_drawRemoved() {
		this.elementContent.classList.add('hidden')
		this.elementName.textContent = '~ Removed ~'
		this.elementActions.classList.add('hidden')
		this.elementOwnerActions.classList.add('hidden')
		if(!this.elementEditForm.classList.contains('hidden'))
			this.elementEditToggle.click()
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
		this.elementOwnerActions.classList.add('hidden')
		if(!this.elementEditForm.classList.contains('hidden'))
			this.elementEditToggle.click()
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
			this.elementOwnerActions.classList.remove('hidden')
			if(this.commentJSON.children.length <= 0)
				this.elementEditToggle.classList.remove('hidden')
			else
				this.elementEditToggle.classList.add('hidden')
			this.elementDownVoteButton.classList.add('disabled')
			this.elementUpVoteButton.classList.add('disabled')
			this.elementFlagButton.classList.add('disabled')
		}
		else {
			// Not Comment Owner
			this.elementOwnerActions.classList.add('hidden')
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
		this.elementEditForm.reset()
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
	constructor({ entity=(()=>{throw new Error('Missing parameter')})()}={}) {
		const commentSection = document.getElementById('comment-section') // Find Comment Section Container
		var rootCommentClass = new Comment({
			commentJSON: {
				_id: undefined,
				accountID: undefined,
				entity: entity,
				parent: undefined,
				upVoteAccountIDs: [],
				downVoteAccountIDs: [],
				removed: false,
				text: 'Comments',
				facebookProfileID: undefined,
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
		rootCommentClass.elementActions.style.marginLeft = '0px'
		rootCommentClass.elementRepliesSection.style.marginLeft = '0px'
		rootCommentClass.elementRepliesToggle.classList.add('active')
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
		rootCommentClass.elementRepliesSection.classList.remove('hidden')
		rootCommentClass.elementLoadOldButton.classList.remove('hidden')
		rootCommentClass._loadOldReplies()
			.then(() => {
				// Jump to the associated comment
				if(window.location.search) {
					let params = new URLSearchParams(window.location.search.substring(1)) // substring(1) to drop the leading "?"
					let commentJump = params.get('comment-jump')
					let commentAncestors = commentJump.split(',')
					rootCommentClass._jumpToComment(commentAncestors)
						.catch(handleServerError)
				}
			})
			.catch(handleServerError)
	}
}