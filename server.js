import express, {json} from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js"
import http from "http";
import { Server } from "socket.io";
import cartSocket from "./socket/cartSocket.js";



dotenv.config();

const app = express();
connectDB();

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

//middlewares
app.use(json());
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/api/deluxefood", authRoute);

// Socket.IO logic
cartSocket(io); ; 

const port = process.env.PORT || 3005

connectDB()
app.listen(port, () =>{
    console.log(`Server running on port ${port}`)
})