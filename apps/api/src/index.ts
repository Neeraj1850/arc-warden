import { getEnv } from "./config/env.js";
import { createApiServer } from "./server.js";

const env = getEnv();
const server = createApiServer();

server.listen(env.port, () => {
  console.log(`ArcWarden API listening on http://localhost:${env.port}`);
});
