import dotenv from 'dotenv';
import express from 'express';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({ path: '../.env' });


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
