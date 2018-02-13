import {
	navigateRoute,
	executeRoute,
	registerRoute } from '/js-modules/myRouter.js'
import {
	logout,
	loginViaFacebook,
	loginViaGoogle,
	loginViaRegistrationToken } from '/js-modules/myAuth.js'
import {
	handleServerError
} from '/js-modules/myUtilities.js'
import {
	loadMain,
	loadLogin,
	loadAccount,
	loadSetPassword,
	closeAllDialogs } from '/index.js'
import { loadArticle } from '/html-templates/main/articles.js'
import { initializePhotos } from '/html-templates/main/photos.js'

registerRoute(/^\//, async () => {
	document.querySelector('#scrollable').scrollTop = 0
	closeAllDialogs()
})
registerRoute(/^\/$/, async () => { // Matching just / or nothing: /(^$|^\/)$/g
	await loadMain('Welcome', '/html-templates/main/welcome.html')
})
registerRoute(/^\/about/, async () => {
	await loadMain('About Me', '/html-templates/main/about.html')
})
registerRoute(/^\/contact/, async () => {
	await loadMain('Contact Me', '/html-templates/main/contact.html')
})
registerRoute(/^\/photos/, async () => {
	await loadMain('My Photos', '/html-templates/main/photos.html')
	await initializePhotos()
})
registerRoute(/^\/articles/, async () => {
	await loadMain('Articles', '/html-templates/main/articles.html')
})
registerRoute(/^\/articles\/([0-9]{4})\/(january|february|march|april|may|june|july|august|september|october|november|december)\/([0-9]{1,2})\/([a-z0-9-]+).html/, async (year, month, day, articleName) => {
	await loadArticle(year, month, day, articleName)
})
registerRoute(/^\/login$/, async () => {
	await loadLogin()
})
registerRoute(/^\/logout$/, async () => {
	await logout()
})
registerRoute(/^\/account/, async () => {
	await loadAccount()
})
registerRoute(/^\/auth\/facebook\/callback#/, async () => {
	await loginViaFacebook(window.location.hash.slice(1))
	await navigateRoute('/')
})
registerRoute(/^\/auth\/google\/callback#/, async () => {
	await loginViaGoogle(window.location.hash.slice(1))
	await navigateRoute('/')
})
registerRoute(/^\/auth\/email\/register\/callback#token=(.+)$/, async (token) => {
	await loginViaRegistrationToken({
		registration_token: decodeURIComponent(token)
	})
	alert('Account registration completed! Welcome!')
	await navigateRoute('/')
})
registerRoute(/^\/auth\/email\/silent-registration\/callback#token=(.+)$/, async (/*token*/) => {
	await loadSetPassword()
})
registerRoute(/^\/auth\/email\/password-reset\/callback#token=(.+)$/, async (/*token*/) => {
	await loadSetPassword()
})
registerRoute(/\?([^#]+)/, async (/*queryString*/) => {

})
registerRoute(/#(.+)$/, async (/*fragment*/) => {

})
executeRoute(window.location.pathname+window.location.search+window.location.hash)
	.catch(handleServerError)