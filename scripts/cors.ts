import {DuploConfig, DuploInstance, PromiseOrNot, Request} from "@duplojs/duplojs";
import packageJson from "../package.json";

declare module "@duplojs/duplojs" {
	interface Plugins {
		"@duplojs/cors": {version: string},
	}
}

export interface DuploCorsOptions {
    allowOrigin?: string | RegExp | (string | RegExp)[] | ((origin: string) => PromiseOrNot<boolean>);
    allowHeaders?: string | string[];
    exposeHeaders?: string | string[];
    maxAge?: number;
	credentials?: boolean;
	allowMethods?: boolean | Request["method"][];
}

export default function duploCors(
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

	if(allowOrigin){
		if(typeof allowOrigin === "string") instance.addHook(
			"onConstructResponse",
			response => {response.setHeader("Access-Control-Allow-Origin", allowOrigin);}
		);
		else if(allowOrigin instanceof RegExp) instance.addHook(
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
		else instance.addHook(
			"beforeRouteExecution",
			async(request, response) => {
				if(await allowOrigin(request.origin) === true) response.setHeader("Access-Control-Allow-Origin", request.origin);
			}
		);
	}

	if(exposeHeaders){
		if(exposeHeaders instanceof Array)exposeHeaders = exposeHeaders.join(", ");

		instance.addHook(
			"beforeRouteExecution",
			(request, response) => {response.setHeader("Access-Control-Expose-Headers", exposeHeaders as string);}
		);
	}
	
	if(credentials) instance.addHook(
		"beforeRouteExecution", 
		(request, response) => {response.setHeader("Access-Control-Allow-Credentials", "true");}
	);

	const methodsRoutes: Record<string, string[]> = {};
	const methodsRoutesBuilded: Record<string, string> = {};

	// Create options routes when route is declare with abstractCors
	instance.addHook("onDeclareRoute", (route) => {
		if(route.method === "OPTIONS") return;
		
		route.path.forEach(path => {
			const optionsRoute = instance.declareRoute("OPTIONS", path);

			if(allowHeaders){
				if(allowHeaders instanceof Array)allowHeaders = allowHeaders.join(", ");
		
				optionsRoute.hook(
					"beforeRouteExecution", 
					(request, response) => {response.setHeader("Access-Control-Allow-Headers", allowHeaders as string);}
				);
			}

			if(maxAge !== undefined) optionsRoute.hook(
				"beforeRouteExecution", 
				(request, response) => {response.setHeader("Access-Control-Max-Age", maxAge.toString());}
			);

			if(allowMethods){
				if(allowMethods instanceof Array){
					const methods = allowMethods.join(", ");
					optionsRoute.hook(
						"beforeRouteExecution", 
						(request, response) => {response.setHeader("Access-Control-Allow-Methods", methods);}
					);
				}
				else {
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
}
