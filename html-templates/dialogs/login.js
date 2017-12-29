import {
	googleLoginSuccess,
	googleLoginFailed } from '/index.js'
import {
	handleServerError,
	post,
	get
} from '/js-modules/myUtilities.js'
import { loginViaCredentials } from '/js-modules/myAuth.js'
import { portfolioApiServerAddress } from '/js-modules/myConfigs.js'

var renderFacebookLogin = () => {
	FB.XFBML.parse()
}

if(typeof FB !== 'undefined' && window.fbAsyncInit.hasRun) { // FB loaded already
	// Ensures
	FB.getLoginStatus(function(response) {
  	renderFacebookLogin()
	})
}
else { // FB not loaded, add load listener
	window.addEventListener('facebook-api-init', (e) => { renderFacebookLogin })
}
var renderGoogleLogin = () => {
	gapi.load('signin2', (e) => {
		gapi.signin2.render('google-login-button', {
			'scope': 'profile email',
			'width': 240,
			'height': 40,
			'longtitle': true,
			'theme': 'dark',
			'onsuccess': googleLoginSuccess,
			'onfailure': googleLoginFailed
		})
	})
}
if(typeof gapi !== 'undefined') { // GoogleAPI loaded
	renderGoogleLogin()
}
else { // Register gapi load event listener
	window.addEventListener('google-api-init', (e) => { renderGoogleLogin() })
}
const formLoginLocal = document.getElementById('login-form-local')
// const formLoginFacebook     = document.getElementById('login-form-facebook')
formLoginLocal.addEventListener('submit', (event) => {
	event.preventDefault()
	loginViaCredentials({
		email: formLoginLocal.elements.namedItem('email').value,
		password: formLoginLocal.elements.namedItem('password').value
	})
  	.catch(handleServerError)
})
const formForgotPassword = document.getElementById('forgot-password-form')
formForgotPassword.addEventListener('submit', (event) => {
	event.preventDefault()
	const jsonData = {}
	for(var i = 0; i < event.target.length - 1; i++) {
		jsonData[formForgotPassword.elements[i].name] = formForgotPassword.elements[i].value
	}
	const response = post({
		route: '/auth/email/forgotpassword/request',
		body: jsonData
	})
		.then(() => { alert('An password recovery links has been sent to your email') })
		.catch(handleServerError)
		.then(() => { navigateRoute('/') })
})
const formRegister = document.getElementById('register-form')
formRegister.addEventListener('submit', (event) => {
	event.preventDefault()
	const jsonData = {}
	for(var i = 0; i < event.target.length - 1; i++) {
		jsonData[formRegister.elements[i].name] = formRegister.elements[i].value
	}
	const response = post({
		route: '/auth/email/register/request',
		body: jsonData
	})
		.then(() => { alert('Thanks for registering! To activate your account continue registration steps in the verification email that has been sent to your address.') })
		.catch(handleServerError)
		.then(() => { navigateRoute('/') })
})