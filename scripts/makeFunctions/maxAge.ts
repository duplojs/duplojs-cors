import {Response} from "@duplojs/duplojs";

export const maxAgeFunction = {
	default(maxAge: string){
		return (response: Response) => {
			response.setHeader("Access-Control-Max-Age", maxAge);
		};
	}
};
