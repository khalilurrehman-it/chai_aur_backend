import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error occurred : ", error);
      throw error;
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed : ", error);
  });

// Below is the first approach to connect to MongoDB using Mongoose.

/*
import express from "express";

const app = express();

// Connect to MongoDB

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("Connected to MongoDB");
        app.on("error" , (error) => {
            console.log("Error occurred : " , error)
            throw error;
        })

        app.listen(process.env.PORT , () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.log("Error : " , error);
        throw error;
    }
})(); */
