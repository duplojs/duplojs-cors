import {Response} from "@duplojs/duplojs";

export const credentialsFunction = {
	default(){
		return (response: Response) => {
			response.setHeader("Access-Control-Allow-Credentials", "true");
		};
	}
};
