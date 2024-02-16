import mongoose from 'mongoose';
import {DB_NAME} from "../constants.js"

const connectDB = async () => {
 try{
   const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
   // console.log(connectionInstance.connection);
   console.log(`MongoDB Connected : ${connectionInstance.connection.host}`);
 }
 catch(error){
  console.log("ERROR : Failed to connect to DB", error);
  process.exit(1);
 }
}

export default connectDB;  