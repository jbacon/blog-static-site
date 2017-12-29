export {
	registerRoute,
	deregisterRoute,
	executeRoute,
	navigateRoute
}
/* My Simple VanillaJS Router for my Single Page Application Flow.
My Definitions:
	- Router: A helper singleton class that enables navigation via history/links.
	- URL: Linkable path address that corresponds to one or more Routes.
	- Route: A subset of URL with a single associated handler.
	- Handler: A function that has one-to-one association w/ a Route.
	- Navigate: Update History, Examine URL, and Apply one or more Routes & Handlers.
*/
window.onpopstate = (/*event*/) => {
	executeRoute(window.location.pathname)
}
let routes = []
/* Register a route w/ a path regular expression & async handler function */
function registerRoute(pathRegExp, asyncHandler) {
	routes.push({
		pathRegExp: pathRegExp,
		handler: asyncHandler
	})
}
/* Deregister a route */
function deregisterRoute(route) {
	for(var i=0; i < routes.length; i++) {
		if(routes[i].pathRegExp === route) {
			routes.remove(i)
		}
	}
}
/* Execute handlers that match route, in order */
async function executeRoute(path) {
	for(let i = 0; i < routes.length; i++) {
		let match = path.match(routes[i].pathRegExp)
		if(match) {
			match.shift()
			await routes[i].handler.apply({}, match) // match contains arguments to handler function
		}
	}
}
/* Push to history then execute route */
async function navigateRoute(path) {
	history.pushState({}, 'Page', path)
	await executeRoute(path)
}
window.portfolio_router_navigateRoute = navigateRoute