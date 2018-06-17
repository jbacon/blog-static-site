export {
	portfolioApiServerAddress,
	googleAppID,
	facebookAppID
}
const portfolioApiServerAddress = location.origin.includes('localhost') ? 'http://localhost:31637' : 'https://portfolioapi.joshbacon.name'
const googleAppID = location.origin.includes('localhost') ? '1074651307568-nhejig1r7egq7hojhvj5smq148m1vvgh.apps.googleusercontent.com' : '1074651307568-nhejig1r7egq7hojhvj5smq148m1vvgh.apps.googleusercontent.com'
const facebookAppID = location.origin.includes('localhost') ? '210957496192329' : '144772189413167'