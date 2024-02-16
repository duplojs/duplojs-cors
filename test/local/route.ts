import Duplo, {zod} from "@duplojs/duplojs";
import {duploCorsAbstract} from "../../scripts";
import {parentPort} from "worker_threads";

const duplo = Duplo({port: 1506, host: "0.0.0.0", environment: "DEV"});
const abstractCors = duplo.use(duploCorsAbstract, {
	allowOrigin: "localhost",
	allowHeaders: ["content-type", "accept"],
	allowMethods: true,
	credentials: true,
	exposeHeaders: ["info"],
	maxAge: 0,
});

abstractCors.declareRoute("GET", "/cors/test/1")
.handler(({}, res) => res.code(200).info("s").send());

abstractCors.declareRoute("POST", "/cors/test/1")
.handler(({}, res) => res.code(200).info("s").send());

abstractCors.declareRoute("GET", "/cors/test/2")
.handler(({}, res) => res.code(200).info("s").send());

abstractCors.declareRoute("POST", "/cors/test/2")
.handler(({}, res) => res.code(200).info("s").send());

abstractCors.declareRoute("PATCH", "/cors/test/2")
.handler(({}, res) => res.code(200).info("s").send());

duplo.launch(() => parentPort?.postMessage("ready"));
