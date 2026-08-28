require("dotenv").config();
const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(); // fails fast with a clear message if MONGODB_URI is missing
  app.listen(PORT, () => {
    console.log(`FarmDirect API listening on http://localhost:${PORT}`);
  });
}

start();
