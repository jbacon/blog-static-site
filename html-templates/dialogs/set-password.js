import {
	getUser,
	currentAuthType,
	getToken,
	loginViaSilentRegistration } from '/js-modules/myAuth.js'
import { handleServerError } from '/js-modules/myUtilities.js'
import { portfolioApiServerAddress } from '/js-modules/myConfigs.js'
import { navigateRoute } from '/js-modules/myRouter.js'

const setPasswordForm = document.getElementById('set-password-form')
setPasswordForm.addEventListener('submit', (event) => {
	event.preventDefault()
	const newPassword = setPasswordForm.querySelector('.new-password').value
	const newPasswordRetyped =  setPasswordForm.querySelector('.new-password-retyped').value
	if(newPassword === newPasswordRetyped) {
		var searchParams = new URLSearchParams(window.location.hash.slice(1));
		loginViaSilentRegistration({
			silent_registration_token: searchParams.get("token"),
			new_password: newPassword
		})
			.catch(handleServerError)
			.then(() => { navigateRoute('/') })
	}
	else {
		alert('Passwords are mismatched. Try re-typing.')
	}
})