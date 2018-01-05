import { portfolioApiServerAddress } from '/js-modules/myConfigs.js'
import { getToken } from '/js-modules/myAuth.js'
import { loadLogin } from '/index.js'

export { importHtml, handleServerError, scaleImgToFillElement, get, post }

/* Using HTML Imports, dynamically insert an import link (if does not exist).
Once loaded pass imported document into provided callback function.
Link element id is generated using provided href */
async function importHtml(href) {
	return new Promise((resolve, reject) => {
		var id = href.replace(/[^A-Za-z0-9]/g, '') // Generate a valid id using the href provided.
		var link = document.querySelector('script#'+id) // Lookup existing script type link element with this id
		if(link) {
			resolve(link.import)
		}
		else {
			link = document.createElement('link')
			link.id = id
			link.rel = 'import'
			link.href = href
			link.setAttribute('async', '')
			link.onload = (result) => {
				resolve(link.import)
			}
			link.onerror = (err) => {
				reject(err)
			}
			document.head.appendChild(link)
		}
	})
}
// function handleClientError(error) {
// 	console.log(error)
// }
function handleServerError(request) {
	if((!request instanceof XMLHttpRequest))
		throw new Error('Not instance of XMLHttpRequest!')
	if(request.status === 0) {
		alert('Oops! No response from server?')
	}
	else if(request.status === 401) {
		alert('Sign in to perform this action')
		loadLogin().catch(handleServerError)
	}
	else if(request.status === 402) {
		alert('Oops! You\'re account is not authorized to perform this action')
	}
	else {
		alert('Oops! Smething went wrong. Message: '+request.response+'. '+request.status+' - '+request.statusText)
	}
}
function scaleImgToFillElement(img, element) {
	const heightFactor = element.clientHeight / img.naturalHeight
	const widthFactor = element.clientWidth / img.naturalWidth
	const scaleFactor = (heightFactor > widthFactor) ? widthFactor : heightFactor
	const newWidth = (img.naturalWidth * scaleFactor) * .9 // scale back 10% more...
	img.style.width = newWidth+'px'
}

async function post({ route=(()=>{throw new Error('Missing parameter')})(), body={} }) {
	var response = new Promise((resolve, reject) => {
		const request = new XMLHttpRequest()
		request.open('POST', portfolioApiServerAddress+route)
		request.setRequestHeader('Authorization', 'Bearer '+getToken())
		request.setRequestHeader('Content-Type', 'application/json')
		request.onload = (event) => {
			if(request.status === 200) {
				resolve(JSON.parse(request.response))
			}
			else {
				reject(request)
			}
		}
		request.onerror = (event) => {
			reject(request)
		}
		request.send(JSON.stringify(body))
	})
	return response
}
async function get({ route=(()=>{throw new Error('Missing parameter')})() }) {
	var response = new Promise((resolve, reject) => {
		const request = new XMLHttpRequest()
		request.open('GET', portfolioApiServerAddress+route)
		request.setRequestHeader('Authorization', 'Bearer '+getToken())
		request.setRequestHeader('Content-Type', 'application/json')
		request.onload = (event) => {
			if(request.status === 200) {
				resolve(JSON.parse(request.response))
			}
			else {
				reject(request)
			}
		}
		request.onerror = (event) => {
			reject(request)
		}
		request.send()
	})
	return response
}