import Duplo, {zod} from "@duplojs/duplojs";
import duploCors from "../../scripts";
import {parentPort} from "worker_threads";

const duplo = Duplo({port: 1506, host: "0.0.0.0", environment: "DEV"});
duplo.use(duploCors, {
	allowOrigin: "localhost",
	allowHeaders: ["content-type", "accept"],
	allowMethods: true,
	credentials: true,
	exposeHeaders: ["info"],
	maxAge: 0,
});

duplo.declareRoute("GET", "/cors/test/1")
.handler(({}, res) => res.code(200).info("s").send());

duplo.declareRoute("POST", "/cors/test/1")
.handler(({}, res) => res.code(200).info("s").send());

duplo.declareRoute("GET", "/cors/test/2")
.handler(({}, res) => res.code(200).info("s").send());

duplo.declareRoute("POST", "/cors/test/2")
.handler(({}, res) => res.code(200).info("s").send());

duplo.declareRoute("PATCH", "/cors/test/2")
.handler(({}, res) => res.code(200).info("s").send());

duplo.launch(() => parentPort?.postMessage("ready"));
