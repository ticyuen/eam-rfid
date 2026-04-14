import app from "./app.js";
import { ENV } from "./config/env.js";

const PORT = ENV.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});