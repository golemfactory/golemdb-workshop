import 'dotenv/config'
import {Hono} from 'hono'
import jsLogger, {ILogger} from "js-logger";

// Configure logger
jsLogger.useDefaults();
jsLogger.setLevel(jsLogger.DEBUG);
jsLogger.setHandler(jsLogger.createDefaultHandler({
  formatter: function(messages, context) {
    // prefix each log message with a timestamp.
    messages.unshift(`[${new Date().toISOString()} ${context.level.name}]`);
  }
}));
const log: ILogger = jsLogger.get("myLogger");

// Create web server using Hono
const app = new Hono()

interface DiceThrow {
  dice: number[]
  sum: number
}

// In-memory storage for dice throws
const data: DiceThrow[] = []

app.get('/', (c) => {
  log.debug("Root endpoint called");
  return c.text('Hello on Golem DB Workshop!')
})

app.get('/api/v1/me', async (c) => {
  log.debug('Requested player name:', process.env.PLAYER_NAME || 'default');
  return c.json(process.env.PLAYER_NAME || 'default')
})

app.get('/api/v1/throws', async (c) => {
  log.debug("Returning throws:", data);
  return c.json(data)
})

app.post('/api/v1/throws', async (c) => {
  log.debug("Received request to roll dice...");
  const roll = Array.from({length: 5}, () => Math.floor(Math.random() * 6) + 1);
  const diceThrow: DiceThrow = {
    dice: roll,
    sum: roll.reduce((a, b) => a + b, 0)
  };
  data.push(diceThrow);
  log.debug("Dice rolled:", diceThrow);
  return c.json(diceThrow);
})

async function initBeforeServerStarts() {
  log.info("Connecting to Golem DB client...");
  // Fill your initialization code here
}

initBeforeServerStarts().then(
  () => {
    const port = 8000;
    log.info(`Starting server at http://localhost:${port}`);
    Bun.serve({
        idleTimeout: 30,
        port,
        fetch: app.fetch,
      }
    );
  }
).catch(
  (e) => {
    console.error(e)
    process.exit(1)
  }
)