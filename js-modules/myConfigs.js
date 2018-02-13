export {
	portfolioApiServerAddress,
	googleAppID,
	facebookAppID
}
const portfolioApiServerAddress = location.origin.includes('localhost') ? 'http://localhost:3000' : 'https://portfolioapi.joshbacon.name'
const googleAppID = '1074651307568-nhejig1r7egq7hojhvj5smq148m1vvgh.apps.googleusercontent.com'
const facebookAppID = '144772189413167'