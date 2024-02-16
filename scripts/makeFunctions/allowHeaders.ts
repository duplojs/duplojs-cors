import {Response} from "@duplojs/duplojs";

export const allowHeadersFunction = {
	default(allowHeaders: string){
		return (response: Response) => {
			response.setHeader("Access-Control-Allow-Headers", allowHeaders);
		};
	}
};
