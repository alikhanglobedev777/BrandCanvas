import { config } from "dotenv";

config({ path: "../../.env" });

const workerEnabled = process.env.WORKER_ENABLED === "true";

if (!workerEnabled) {
  console.log("BrandCanvas worker bootstrap is ready. Set WORKER_ENABLED=true after adding queue processors.");

  const heartbeat = setInterval(() => undefined, 60_000);

  const shutdown = () => {
    clearInterval(heartbeat);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} else {
  console.log("WORKER_ENABLED=true, but no production queue processor has been registered yet.");
}
