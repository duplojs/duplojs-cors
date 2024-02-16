import {DuploConfig, DuploInstance, PromiseOrNot, Request} from "@duplojs/duplojs";
import packageJson from "../package.json";
import {allowOriginFunction} from "./makeFunctions/allowOrigin";
import {exposeHeadersFunction} from "./makeFunctions/exposeHeaders";
import {credentialsFunction} from "./makeFunctions/credentials";
import {allowHeadersFunction} from "./makeFunctions/allowHeaders";
import {maxAgeFunction} from "./makeFunctions/maxAge";
import {allowMethodsFunction} from "./makeFunctions/allowMethods";

declare module "@duplojs/duplojs" {
	interface Plugins {
		"@duplojs/cors": {version: string},
	}
}

export interface DuploCorsOptions {
    allowOrigin?: string | RegExp | (string | RegExp)[] | ((origin: string) => PromiseOrNot<boolean>);
    allowHeaders?: string | string[] | boolean;
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
			allowOriginFunction.isString(allowOrigin)
		);
		else if(allowOrigin instanceof RegExp) instance.addHook(
			"beforeRouteExecution",
			allowOriginFunction.isRegExp(allowOrigin)
		);
		else if(allowOrigin instanceof Array) instance.addHook(
			"beforeRouteExecution",
			allowOriginFunction.isArray(allowOrigin)
		);
		else instance.addHook(
			"beforeRouteExecution",
			allowOriginFunction.isFunction(allowOrigin)
		);
	}

	if(exposeHeaders){
		if(exposeHeaders instanceof Array)exposeHeaders = exposeHeaders.join(", ");

		instance.addHook(
			"onConstructResponse",
			exposeHeadersFunction.default(exposeHeaders as string)
		);
	}
	
	if(credentials) instance.addHook(
		"onConstructResponse", 
		credentialsFunction.default()
	);
	
	const methodsRoutes: Record<string, string[]> = {};
	const methodsRoutesBuilded: Record<string, string> = {};
	instance.addHook(
		"beforeBuildRouter",
		() => Object.entries(methodsRoutes).forEach(([key, value]) => 
			methodsRoutesBuilded[key] = value.join(", ")
		)
	);

	// Create options routes when route is declare with abstractCors
	instance.addHook("onDeclareRoute", (route) => {
		if(route.method === "OPTIONS") return;
		
		const optionsRouteBuilder = instance.declareRoute("OPTIONS", route.paths);

		if(allowHeaders){
			if(allowHeaders === true && Object.keys(route.extracted.headers || {})[0]){
				optionsRouteBuilder.hook(
					"onConstructResponse", 
					allowHeadersFunction.default(Object.keys(route.extracted.headers || {}).join(", "))
				);
			}
			else {
				if(allowHeaders instanceof Array)allowHeaders = allowHeaders.join(", ");
	
				optionsRouteBuilder.hook(
					"onConstructResponse", 
					allowHeadersFunction.default(allowHeaders as string)
				);
			}
		}

		if(maxAge !== undefined) optionsRouteBuilder.hook(
			"onConstructResponse", 
			maxAgeFunction.default(maxAge.toString())
		);
		
		if(allowMethods){
			if(allowMethods instanceof Array){
				optionsRouteBuilder.hook(
					"onConstructResponse", 
					allowMethodsFunction.isArray(allowMethods.join(", "))
				);
			}
			else {
				route.paths.forEach(path => {
					if(!methodsRoutes[path]) methodsRoutes[path] = [];
					methodsRoutes[path].push(route.method);
				});

				optionsRouteBuilder.hook(
					"beforeRouteExecution", 
					allowMethodsFunction.isBool(methodsRoutesBuilded)
				);
			}
		}

		optionsRouteBuilder.hook(
			"beforeRouteExecution", 
			(request, response) => {response.code(204).send();}
		);

		optionsRouteBuilder.handler(() => {});
	});
}
