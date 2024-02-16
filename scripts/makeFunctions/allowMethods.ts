import {Request, Response} from "@duplojs/duplojs";

export const allowMethodsFunction = {
	isArray(methods: string){
		return (response: Response) => {
			response.setHeader("Access-Control-Allow-Methods", methods);
		};
	},

	isBool(allowMethods: Record<string, string>){
		return (request: Request, response: Response) => {
			if(request.matchedPath){
				response.setHeader("Access-Control-Allow-Methods", allowMethods[request.matchedPath]);
			}
		};
	}
};
