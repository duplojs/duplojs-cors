import {PromiseOrNot, Request, Response} from "@duplojs/duplojs";

export const allowOriginFunction = {
	isString(allowOrigin: string){
		return (response: Response) => {
			response.setHeader("Access-Control-Allow-Origin", allowOrigin);
		};
	},

	isRegExp(allowOrigin: RegExp){
		return (request: Request, response: Response) => {
			if(allowOrigin.test(request.origin)){
				response.setHeader("Access-Control-Allow-Origin", request.origin);
			}
		};
	},

	isArray(allowOrigin: (string | RegExp)[]){
		return (request: Request, response: Response) => {
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
		};
	},

	isFunction(allowOrigin: (origin: string) => PromiseOrNot<boolean>){
		return async(request: Request, response: Response) => {
			if(await allowOrigin(request.origin) === true){
				response.setHeader("Access-Control-Allow-Origin", request.origin);
			}
		};
	}
};
