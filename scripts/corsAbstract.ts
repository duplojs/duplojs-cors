import {AbstractRoute, DuploConfig, DuploInstance} from "@duplojs/duplojs";
import {hasDuplose, extractAbstractRoute} from "@duplojs/editor-tools";
import {DuploCorsOptions} from "./cors";
import packageJson from "../package.json";
import {allowOriginFunction} from "./makeFunctions/allowOrigin";
import {exposeHeadersFunction} from "./makeFunctions/exposeHeaders";
import {credentialsFunction} from "./makeFunctions/credentials";
import {allowHeadersFunction} from "./makeFunctions/allowHeaders";
import {maxAgeFunction} from "./makeFunctions/maxAge";
import {allowMethodsFunction} from "./makeFunctions/allowMethods";

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

	const instanceAbstractCors = instance.declareAbstractRoute(`abstractCors${duploCorsAbstract.count++}`).build()();
	const abstractCors = extractAbstractRoute(instanceAbstractCors) as AbstractRoute;

	//add "Access-Control-Allow-Origin" header to request declare with abstractCors
	if(allowOrigin){
		if(typeof allowOrigin === "string") abstractCors.hooksLifeCyle.onConstructResponse.addSubscriber(
			allowOriginFunction.isString(allowOrigin)
		);
		else if(allowOrigin instanceof RegExp) abstractCors.hooksLifeCyle.beforeRouteExecution.addSubscriber(
			allowOriginFunction.isRegExp(allowOrigin)
		);
		else if(allowOrigin instanceof Array) abstractCors.hooksLifeCyle.beforeRouteExecution.addSubscriber(
			allowOriginFunction.isArray(allowOrigin)
		);
		else abstractCors.hooksLifeCyle.beforeRouteExecution.addSubscriber(
			allowOriginFunction.isFunction(allowOrigin)
		);
	}

	//add "Access-Control-Expose-Headers" header to request declare with abstractCors
	if(exposeHeaders){
		if(exposeHeaders instanceof Array)exposeHeaders = exposeHeaders.join(", ");

		abstractCors.hooksLifeCyle.onConstructResponse.addSubscriber(
			exposeHeadersFunction.default(exposeHeaders as string)
		);
	}

	//add "Access-Control-Allow-Credentials" header to request declare with abstractCors
	if(credentials) abstractCors.hooksLifeCyle.onConstructResponse.addSubscriber(
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
		if(route.method === "OPTIONS" || !hasDuplose(route, abstractCors)) return;

		const optionsRouteBuilder = instanceAbstractCors.declareRoute("OPTIONS", route.paths);

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

	return instanceAbstractCors;
}

duploCorsAbstract.count = 0;

export default duploCorsAbstract;
