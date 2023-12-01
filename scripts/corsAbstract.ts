import {AbstractRoute, DuploConfig, DuploInstance} from "@duplojs/duplojs";
import {DuploCorsOptions} from "./cors";
import packageJson from "../package.json";

function findAbstractCors(abstract?: AbstractRoute){
	if(!abstract) return false;
	else if(abstract.name.startsWith("abstractCors")) return true;
	else if(abstract.mergeAbstractRoute){
		for(const mar of abstract.mergeAbstractRoute){
			if(findAbstractCors(mar)) return true;
		}
	}
	else return findAbstractCors(abstract.parentAbstractRoute);
}

function duploCorsAbstract(
	instance: DuploInstance<DuploConfig>, 
	{
		allowOrigin,
		allowHeaders,
		exposeHeaders,
		maxAge,
		credentials,
		allowMethods,
	}: DuploCorsOptions = {}
){
	instance.plugins["@duplojs/cors"] = {version: packageJson.version};

	const nameAbstractCors = `abstractCors${duploCorsAbstract.count++}`;
	const abstractCors = instance.declareAbstractRoute(nameAbstractCors);

	//add "Access-Control-Allow-Origin" header to request declare with abstractCors
	if(allowOrigin){
		if(typeof allowOrigin === "string") abstractCors.hook(
			"onConstructResponse",
			response => {response.setHeader("Access-Control-Allow-Origin", allowOrigin);}
		);
		else if(allowOrigin instanceof RegExp) abstractCors.hook(
			"beforeRouteExecution",
			(request, response) => {
				if(allowOrigin.test(request.origin)) response.setHeader("Access-Control-Allow-Origin", request.origin);
			}
		);
		else if(allowOrigin instanceof Array) instance.addHook(
			"beforeRouteExecution",
			(request, response) => {
				for(const origin of allowOrigin){
					if(typeof origin === "string"){
						if(origin === request.origin){
							response.setHeader("Access-Control-Allow-Origin", request.origin);
							break;
						}
					}
					else if(origin.test(request.origin)){ 
						response.setHeader("Access-Control-Allow-Origin", request.origin);
						break;
					}
				}
			}
		);
		else abstractCors.hook(
			"beforeRouteExecution",
			async(request, response) => {
				if(await allowOrigin(request.origin) === true) response.setHeader("Access-Control-Allow-Origin", request.origin);
			}
		);
	}

	//add "Access-Control-Expose-Headers" header to request declare with abstractCors
	if(exposeHeaders){
		if(exposeHeaders instanceof Array)exposeHeaders = exposeHeaders.join(", ");

		abstractCors.hook(
			"beforeRouteExecution",
			(request, response) => {response.setHeader("Access-Control-Expose-Headers", exposeHeaders as string);}
		);
	}

	//add "Access-Control-Allow-Credentials" header to request declare with abstractCors
	if(credentials) abstractCors.hook(
		"beforeRouteExecution", 
		(request, response) => {response.setHeader("Access-Control-Allow-Credentials", "true");}
	);

	const methodsRoutes: Record<string, string[]> = {};
	const methodsRoutesBuilded: Record<string, string> = {};
	
	// Create options routes when route is declare with abstractCors
	instance.addHook("onDeclareRoute", (route) => {
		if(!findAbstractCors(route.abstractRoute)) return;
		
		route.path.forEach(path => {
			const optionsRoute = instance.declareRoute("OPTIONS", path);

			//add "Access-Control-Allow-Origin" header to preflight
			if(allowOrigin){
				if(typeof allowOrigin === "string") optionsRoute.hook(
					"onConstructResponse",
					response => {response.setHeader("Access-Control-Allow-Origin", allowOrigin);}
				);
				else if(allowOrigin instanceof RegExp) optionsRoute.hook(
					"beforeRouteExecution",
					(request, response) => {
						if(allowOrigin.test(request.origin)) response.setHeader("Access-Control-Allow-Origin", request.origin);
					}
				);
				else if(allowOrigin instanceof Array) instance.addHook(
					"beforeRouteExecution",
					(request, response) => {
						for(const origin of allowOrigin){
							if(typeof origin === "string"){
								if(origin === request.origin){
									response.setHeader("Access-Control-Allow-Origin", request.origin);
									break;
								}
							}
							else if(origin.test(request.origin)){ 
								response.setHeader("Access-Control-Allow-Origin", request.origin);
								break;
							}
						}
					}
				);
				else optionsRoute.hook(
					"beforeRouteExecution",
					async(request, response) => {
						if(await allowOrigin(request.origin) === true) response.setHeader("Access-Control-Allow-Origin", request.origin);
					}
				);
			}

			//add "Access-Control-Expose-Headers" header to preflight
			if(exposeHeaders){
				if(exposeHeaders instanceof Array)exposeHeaders = exposeHeaders.join(", ");
		
				optionsRoute.hook(
					"beforeRouteExecution",
					(request, response) => {response.setHeader("Access-Control-Expose-Headers", exposeHeaders as string);}
				);
			}
		
			//add "Access-Control-Allow-Credentials" header to preflight
			if(credentials) optionsRoute.hook(
				"beforeRouteExecution", 
				(request, response) => {response.setHeader("Access-Control-Allow-Credentials", "true");}
			);
			
			//add "Access-Control-Allow-Headers" header to preflight (only)
			if(allowHeaders){
				if(allowHeaders instanceof Array)allowHeaders = allowHeaders.join(", ");
		
				optionsRoute.hook(
					"beforeRouteExecution", 
					(request, response) => {response.setHeader("Access-Control-Allow-Headers", allowHeaders as string);}
				);
			}

			//add "Access-Control-Max-Age" header to preflight (only)
			if(maxAge !== undefined) optionsRoute.hook(
				"beforeRouteExecution", 
				(request, response) => {response.setHeader("Access-Control-Max-Age", maxAge.toString());}
			);
			
			//add "Access-Control-Allow-Methods" header to preflight (only)
			if(allowMethods){
				if(allowMethods instanceof Array){
					const methods = allowMethods.join(", ");
					optionsRoute.hook(
						"beforeRouteExecution", 
						(request, response) => {response.setHeader("Access-Control-Allow-Methods", methods);}
					);
				}
				else {
					//save methods of différent route
					if(!methodsRoutes[path]) methodsRoutes[path] = [];
					methodsRoutes[path].push(route.method);
						
					optionsRoute.hook(
						"beforeRouteExecution", 
						(request, response) => {response.setHeader("Access-Control-Allow-Methods", methodsRoutesBuilded[path]);}
					);
		
					instance.addHook(
						"onReady",
						() => Object.entries(methodsRoutes).forEach(([key, value]) => 
							methodsRoutesBuilded[key] = value.join(", ")
						)
					);
				}
			}

			optionsRoute.hook(
				"beforeRouteExecution", 
				(request, response) => {response.code(204).send();}
			);

			optionsRoute.handler(() => {});
		});
	});

	return abstractCors.build()();
}

duploCorsAbstract.count = 0;

export default duploCorsAbstract;
