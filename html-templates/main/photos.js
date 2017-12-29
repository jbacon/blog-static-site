import { scaleImgToFillElement } from '/js-modules/myUtilities.js'

export { initializePhotos }

async function initializePhotos() {
	const previewImages = document.querySelectorAll('img.preview')
	const previewViewport = document.querySelector('my-carousel')
	for(let i=0; i < previewImages.length; i++) {
		if(previewImages[i].naturalHeight === 0) {
			previewImages[i].onload = (e) => {
				scaleImgToFillElement(previewImages[i], previewViewport)
			}
		}
		else {
			scaleImgToFillElement(previewImages[i], previewViewport)
		}
	}
	const fullscreenImages = document.querySelectorAll('img.fullscreen')
	const fullscreenViewport = document.querySelector('body')
	for(let i=0; i < fullscreenImages.length; i++) {
		if(fullscreenImages[i].naturalHeight === 0) {
			fullscreenImages[i].onload = (e) => {
				scaleImgToFillElement(fullscreenImages[i], fullscreenViewport)
			}
		}
		else {
			scaleImgToFillElement(fullscreenImages[i], fullscreenViewport)
		}
	}
}