import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})

import {v2 as cloudinary} from 'cloudinary'
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

import express from 'express';
import connectDB from './db/index.js';
import { app } from './app.js';



console.log("API_KEY", process.env.CLOUDINARY_API_KEY )
console.log("CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME)
console.log("API_SECRET", process.env.CLOUDINARY_API_SECRET )

connectDB()
.then(() =>{
    app.listen(process.env.PORT,() => {
        console.log(`Server has Started at Port: ${process.env.PORT}`);
    })
})
.catch((err) =>{
    console.log(console.log("MongoDB Connection Failed", err))
})

// node -r dotenv/config "D:\Learning & Skill\MERN STACK\BackEnd\MERN-Youtube-with-Twitter\node_modules\nodemon\bin\nodemon.js" src/index.js
