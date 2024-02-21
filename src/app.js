import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
 origin : process.env.CORS_ORIGIN,
 credentials: true
}));

app.use(express.json({limit:"50kb"}));
app.use(express.urlencoded({extended:true, limit:"50kb"}));
app.use(express.static('public'));
app.use(cookieParser());

import userRouter from './routes/user.routes.js';
import healthcheckRouter from "./routes/healthcheck.routes.js"

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)

export {app};