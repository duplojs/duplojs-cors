# duplojs-cors

## Instalation
```
npm i @duplojs/cors
```

## Utilisation

### Global:
```ts
import Duplo from "@duplojs/duplojs";
import duploCors from "@duplojs/cors";

const duplo = Duplo({port: 1506, host: "0.0.0.0"});
duplo.use(duploCors, {
    allowOrigin: "localhost",
    allowHeaders: ["content-type", "accept"],
    allowMethods: true,
    credentials: true,
    exposeHeaders: ["info"],
    maxAge: 0,
});

// declare routes ...

duplo.launch();
```

### Local:
```ts
import Duplo from "@duplojs/duplojs";
import {duploCorsAbstract} from "@duplojs/cors";

const duplo = Duplo({port: 1506, host: "0.0.0.0"});
const abstractCors = duplo.use(duploCorsAbstract, {
    allowOrigin: "localhost",
    allowHeaders: ["content-type", "accept"],
    allowMethods: true,
    credentials: true,
    exposeHeaders: ["info"],
    maxAge: 0,
});

// declare routes with abstract route ...
abstractCors.declareRoute("GET", "/")
.handler((floor, response) => {
    response.code(200).info("successful").send();
});

duplo.launch();
```