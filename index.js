import {
	importHtml,
	handleServerError
} from '/js-modules/myUtilities.js'
import {
	logout,
	currentAuthType,
	getToken,
	getUser }
	from '/js-modules/myAuth.js'
import { } from '/js-modules/myRoutes.js'
import {
	googleAppID,
	facebookAppID }
	from '/js-modules/myConfigs.js'
import {
	loginViaFacebook,
	loginViaGoogle }
	from '/js-modules/myAuth.js'

export {
	loadLogin,
	loadAccount,
	loadMain,
	loadSetPassword,
	googleLoginFailed,
	googleLoginSuccess,
	closeAllDialogs
}

document.getElementById('user-bar-logout').addEventListener('click', (/*event*/) => {
	logout().then()
})
document.querySelector('#user-bar-connect > *').addEventListener('click', (/*event*/) => {
	loadLogin().then()
})
document.querySelector('#user-bar-account > *').addEventListener('click', (/*event*/) => {
	loadAccount().then()
})
if(getToken()) {
	enableLoginFeatures()
}
else {
	disableLoginFeatures()
}
window.addEventListener('login-event', (/*e*/) => {
	enableLoginFeatures()
})
window.addEventListener('logout-event', (/*e*/) => {
	disableLoginFeatures()
})
function enableLoginFeatures() {
	document.getElementById('user-bar-logout').classList.remove('hidden')
	closeAllDialogs()
	document.getElementById('user-bar-connect').classList.add('hidden')
	document.getElementById('user-bar-profile-pic').classList.remove('hidden')
	if(currentAuthType === '/auth/facebook/token') {
		document.getElementById('user-bar-profile-pic').firstElementChild.src = 'http://graph.facebook.com/'+getUser().facebookProfileID+'/picture?type=large'
	}
	else if(currentAuthType === '/auth/google/token') {
		const client = new XMLHttpRequest()
		client.onload = (/*e*/) => {
			if(client.status === 200) {
				const response = JSON.parse(client.response)
				document.getElementById('user-bar-profile-pic').firstElementChild.src = response.entry.gphoto$thumbnail.$t
			}
			else {
				handleServerError(client)
			}
		}
		client.onerror = (/*e*/) => {
			handleServerError(client)
		}
		client.open('GET', 'http://picasaweb.google.com/data/entry/api/user/'+getUser().googleProfileID+'?alt=json')
		client.send()
	}
	else {
		document.getElementById('user-bar-profile-pic').firstElementChild.src = '/assets/images/profile-pic-default.jpg'
	}
	document.getElementById('user-bar-greeting').innerText = 'Welcome, '+getUser().nameFirst+' '+getUser().nameLast
	document.getElementById('user-bar-greeting').classList.remove('hidden')
	document.getElementById('user-bar-account').classList.remove('hidden')
}
function disableLoginFeatures() {
	document.getElementById('user-bar-logout').classList.add('hidden')
	document.getElementById('user-bar-connect').classList.remove('hidden')
	document.getElementById('user-bar-profile-pic').classList.add('hidden')
	document.getElementById('user-bar-greeting').classList.add('hidden')
	document.getElementById('user-bar-account').classList.add('hidden')
}
async function loadMain(title, href) {
	const newDoc = await importHtml(href)
	const oldMainHeader = document.querySelector('#scrollable > main > header')
	if(oldMainHeader.textContent != title) { // Don't replace content if already displayed
		const newMainHeader = oldMainHeader.cloneNode(false)
		newMainHeader.innerHTML = title
		oldMainHeader.replaceWith(newMainHeader)
		const oldMainSection = document.querySelector('main section')
		const newMainSection = oldMainSection.cloneNode(false) // Clone but without the children...
		newMainSection.appendChild(document.importNode(newDoc.querySelector('template').content, true))
		oldMainSection.replaceWith(newMainSection)
	}
}
async function loadLogin() {
	return loadDialog('user-bar-connect', '/html-templates/dialogs/login.html')
}
async function loadAccount() {
	return loadDialog('user-bar-account', '/html-templates/dialogs/account.html')
}
async function loadSetPassword() {
	return loadDialog('user-bar-set-password', '/html-templates/dialogs/set-password.html')
}
async function loadDialog(dialogElementId, url) {
	const newDoc = await importHtml(url)
	const navBarItem = document.getElementById(dialogElementId)
	if(navBarItem.lastElementChild.childElementCount === 0) {
		const newContentHolder = document.createElement('div')
		newContentHolder.slot='content'
		const newContent = document.importNode(newDoc.querySelector('template').content, true)
		newContentHolder.appendChild(newContent)
		navBarItem.lastElementChild.replaceWith(newContentHolder)
	}
	navBarItem.opened = true
}

/* Initialization Facebook SDK */
window.fbAsyncInit = (/*e*/) => {
	FB.init({
		appId            : facebookAppID,
		autoLogAppEvents : true,
		xfbml            : true,
		version          : 'v2.11',
		cookie           : true
	})
	window.dispatchEvent(new Event('facebook-api-init'))
	// FB.AppEvents.logPageView();
	// Events: https://developers.facebook.com/docs/reference/javascript/FB.Event.subscribe/v2.10
	FB.Event.subscribe('auth.login', function(response) {
		if(response.status === 'connected') {
			// console.log('Facebook - Event - auth.login')
			loginViaFacebook({
				access_token: response.authResponse.accessToken,
				expires_in: response.authResponse.expiresIn
			})
				.catch(handleServerError)
		}
	})
	// Using getLoginStatus to
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			// Logged into your app and Facebook.
			loginViaFacebook({
				access_token: response.authResponse.accessToken,
				expires_in: response.authResponse.expiresIn
			})
				.catch(handleServerError)
		}
	})
	window.addEventListener('logout-event', function(/*e*/) {
		FB.getLoginStatus(function(response) {
			if (response.status === 'connected') {
				FB.logout(function(/*response*/) {
					// user is now logged out
				})
			}
		})
	})
}
/* Initialize Google SDK */
window.googleApiInit = (/*e*/) => {
	gapi.load('auth2', () => {
		gapi.auth2.init({
			client_id: googleAppID,
			scope: 'profile email'
		})
		window.dispatchEvent(new Event('google-api-init'))
		gapi.auth2.getAuthInstance().isSignedIn.listen(function(signedIn) {
			// console.log('Google - Auth2 - Event - SignInStatusChange('+signedIn+')')
			if(signedIn) { //Sign in
				loginViaGoogle({
					access_token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token,
					expires_in: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse(true).expires_in
				})
					.catch(handleServerError)
			}
		})
	})
	window.addEventListener('logout-event', (/*e*/) => {
		gapi.auth2.getAuthInstance().signOut()
	})
}
/* Initialization LinkedIn SDK */
// window.linkedInAsyncInit = (e) => {
// 	IN.Event.on(IN, "auth", function(data) {
// 		console.log("LinkedIn Login")
// 		IN.API.Raw("/people/~")
// 		.result(function(data) {
// 			console.log("LinkedIn User Data: "+data)
// 			window.portfolio.apis.auth.loginViaLinkedIn(IN.ENV.auth.oauth_token)
// 		})
// 		.error(function(data) {
// 			console.log("LinkedIn Failed User Data: "+data);
// 		});
// 	});
// 	IN.Event.on(IN, "logout", (e) => {
// 		console.log("LinkedIn Logout")
// 	});
// }

function googleLoginSuccess() {
	var access_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
	var expires_in = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().expires_in
	loginViaGoogle({
		access_token: access_token,
		expires_in: expires_in
	})
		.catch(handleServerError)
}
function googleLoginFailed() {
	handleServerError({
		status: '500',
		message: 'Google Login Failed'
	})
		.catch(handleServerError)
}
function closeAllDialogs() {
	// Close all open dialogs... (can cause some serious UI issues..)
	var dialogs = document.querySelectorAll('my-dialog-button')
	for(var i = 0; i < dialogs.length; i++) {
		dialogs[i].opened = false
	}
}