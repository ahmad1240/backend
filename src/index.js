// require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("ERROR", error);
    });
  })
  .catch((error) => {
    console.log("MongoDb connection failed!!!", error);
  });
/*
import express from "express";

const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  } catch (error) {
    console.log("ERROR:", error);
  }
})();
*/
