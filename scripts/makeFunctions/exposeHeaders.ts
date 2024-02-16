import {Response} from "@duplojs/duplojs";

export const exposeHeadersFunction = {
	default(exposeHeaders: string){
		return (response: Response) => {
			response.setHeader("Access-Control-Expose-Headers", exposeHeaders);
		};
	}
};
