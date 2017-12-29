import { portfolioApiServerAddress } from '/js-modules/myConfigs.js'
import { get, post } from '/js-modules/myUtilities.js'

export {
	currentAuthType,
	getToken,
	getUser,
	loginViaGoogle,
	loginViaFacebook,
	loginViaCredentials,
	loginViaRegistrationToken,
	loginViaSilentRegistration,
	login,
	logout
}

let currentAuthType = null

if(window.localStorage.token) {
	const tokenSplit = window.localStorage.token.split('.')
	// const header = JSON.parse(atob(tokenSplit[0]))
	const payload = JSON.parse(atob(tokenSplit[1]))
	// const signature = tokenSplit[2]
	if(payload.exp < Math.floor(Date.now() / 1000)) {
		delete window.localStorage.token
		currentAuthType = null
	}
}
else {
	delete window.localStorage.token
	currentAuthType = null
}
function getToken() {
	return window.localStorage.token
}
function getUser() {
	return (window.localStorage.token) ? JSON.parse(atob(window.localStorage.token.split('.')[1])).data : null
}
async function loginViaGoogle({ access_token=(()=>{throw new Error('Missing parameter')})() }) {
	return login({
		rest_api_path: '/auth/google/token',
		bodyJson: {
			access_token: encodeURIComponent(access_token)
		}
	})
}
async function loginViaFacebook({ access_token=(()=>{throw new Error('Missing parameter')})() }) {
	return login({
		rest_api_path: '/auth/facebook/token',
		bodyJson: {
			access_token: encodeURIComponent(access_token)
		}
	})
}
async function loginViaCredentials({
	email=(()=>{throw new Error('Missing parameter')})(),
	password=(()=>{throw new Error('Missing parameter')})()
}) {
	return login({
		rest_api_path: '/auth/email/login',
		bodyJson: {
			email: encodeURIComponent(email),
			password: encodeURIComponent(password)
		}
	})
}
async function loginViaRegistrationToken({ registration_token=(()=>{throw new Error('Missing parameter')})() }) {
	return login({
		rest_api_path: '/auth/email/register/callback',
		bodyJson: {
			token: encodeURIComponent(registration_token)
		}
	})
}
async function loginViaSilentRegistration({
	silent_registration_token=(()=>{throw new Error('Missing parameter')})(),
	new_password=(()=>{throw new Error('Missing parameter')})()
}) {
	return login({
		rest_api_path: '/auth/email/silent-registration/callback',
		bodyJson: {
			token: encodeURIComponent(silent_registration_token),
			password: new_password
		}
	})
}
async function login({
	rest_api_path=(()=>{throw new Error('Missing parameter')})(),
	bodyJson
}) {
	const response = await post({
		route: rest_api_path,
		body: bodyJson
	})
	window.localStorage.token = response.token
	currentAuthType = rest_api_path
	window.dispatchEvent(new Event('login-event'))
}
async function logout() {
	delete window.localStorage.token
	currentAuthType = null
	window.dispatchEvent(new Event('logout-event'))
	return
}