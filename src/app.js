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
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)

export {app};