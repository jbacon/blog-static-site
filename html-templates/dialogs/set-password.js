import {
	loginViaSilentRegistration,
	loginViaPasswordReset } from '/js-modules/myAuth.js'
import { handleServerError } from '/js-modules/myUtilities.js'
import { navigateRoute } from '/js-modules/myRouter.js'

const setPasswordForm = document.getElementById('set-password-form')
setPasswordForm.addEventListener('submit', (event) => {
	event.preventDefault()
	const newPassword = setPasswordForm.querySelector('.new-password').value
	const newPasswordRetyped =  setPasswordForm.querySelector('.new-password-retyped').value
	setPasswordForm.reset()
	if(newPassword === newPasswordRetyped) {
		const searchParams = new URLSearchParams(window.location.hash.slice(1))
		const token = searchParams.get('token')
		const type = JSON.parse(atob(token.split('.')[1])).data.type
		if(type === 'silent-registration') {
			loginViaSilentRegistration({
				silent_registration_token: token,
				new_password: newPassword
			})
				.catch(handleServerError)
				.then(() => { navigateRoute('/') })
		}
		else if(type === 'password-reset') {
			loginViaPasswordReset({
				password_reset_token: token,
				new_password: newPassword
			})
				.catch(handleServerError)
				.then(() => { navigateRoute('/') })
		}
	}
	else {
		alert('Passwords mismatched.. retype')
	}
})