import dotenv from 'dotenv';
import express from 'express';
import connectDB from './db/index.js';

dotenv.config({ path: '../.env' });


connectDB();

// node -r dotenv/config "D:\Learning & Skill\MERN STACK\BackEnd\MERN-Youtube-with-Twitter\node_modules\nodemon\bin\nodemon.js" src/index.js
