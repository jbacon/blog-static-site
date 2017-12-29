import {
	getUser,
	currentAuthType,
	getToken } from '/js-modules/myAuth.js'
import {
	handleServerError,
	get,
	post
} from '/js-modules/myUtilities.js'
import { portfolioApiServerAddress } from '/js-modules/myConfigs.js'

const editDetailsForm = document.getElementById('edit-details-form')
const editDetailsFormInputEmail = editDetailsForm.querySelector('.email')
const editDetailsFormInputNameFirst = editDetailsForm.querySelector('.name-first')
const editDetailsFormInputNameLast = editDetailsForm.querySelector('.name-last')
const editDetailsFormInputSubmit = editDetailsForm.querySelector('.submit')
const passwordResetForm = document.getElementById('password-reset-form')

var initUser = () => {
	editDetailsFormInputEmail.value = getUser().email
	editDetailsFormInputNameFirst.value = getUser().nameFirst
	editDetailsFormInputNameLast.value = getUser().nameLast
}
if(getToken()) {
	initUser()
}
window.addEventListener('login-event', (e) => {
	initUser()
})
window.addEventListener('logout-event', (e) => {
	editDetailsFormInputEmail.value = ''
	editDetailsFormInputNameFirst.value = ''
	editDetailsFormInputNameLast.value = ''
})
passwordResetForm.addEventListener('submit', (event) => {
	event.preventDefault()
	const oldPassword = document.getElementById('password-reset-form').querySelector('.old-password').value
	const newPassword = document.getElementById('password-reset-form').querySelector('.new-password').value
	const newPasswordRetyped =  document.getElementById('password-reset-form').querySelector('.new-password-retyped').value
	if(newPassword == newPasswordRetyped) {
		post({
			route: '/account/reset-password',
			body: {
				oldPassword: oldPassword,
				newPassword: newPassword
			}
		})
	.then((response) => { alert('Password reset! Logout to apply changes') })
	.catch(handleServerError)
	}
	else {
		alert('Passwords mismatched. Try retyping password fields.')
	}
})
editDetailsForm.addEventListener('submit', (event) => {
	event.preventDefault()
	post({
		route: '/account/edit-details',
		body: {
			email: document.getElementById('edit-details-form').querySelector('.email').value,
			nameFirst: document.getElementById('edit-details-form').querySelector('.name-first').value,
			nameLast: document.getElementById('edit-details-form').querySelector('.name-last').value
		}
	})
	.then((response) => { alert('Success! Logout to apply changes') })
	.catch(handleServerError)
})