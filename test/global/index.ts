import {workerTesting} from "@duplojs/worker-testing";

export default workerTesting(
	__dirname + "/route.ts",
	[
		{
			title: "preflight",
			url: "http://localhost:1506/cors/test/1",
			method: "OPTIONS",
			response: {
				code: 204,
				headers: {
					"Access-Control-Allow-Origin": "localhost",
					"Access-Control-Allow-Methods": "GET, POST",
					"Access-Control-Allow-Headers": "content-type, accept",
					"Access-Control-Max-Age": "0",
				},
			}
		},
		{
			title: "preflight 2",
			url: "http://localhost:1506/cors/test/2",
			method: "OPTIONS",
			response: {
				code: 204,
				headers: {
					"Access-Control-Allow-Methods": "GET, POST, PATCH",
				},
			}
		},
		{
			title: "normal request",
			url: "http://localhost:1506/cors/test/2",
			method: "GET",
			response: {
				code: 200,
				headers: {
					"Access-Control-Allow-Credentials": "true",
					"Access-Control-Expose-Headers": "info",
				},
			}
		},
	]
);
