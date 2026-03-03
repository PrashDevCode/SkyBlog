import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';


const app= express();
dotenv.config(); 

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.error("MongoDB connection error:", err));

app.set("view engine","ejs"); 
app.use(express.static("public"));
app.set("views" , path.resolve("./views"));
app.use(express.urlencoded({ extended: true })); // to parse form data

app.use("/user", userRoutes);

app.get("/", (req, res)=> {
    res.render("home");
})

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
});


