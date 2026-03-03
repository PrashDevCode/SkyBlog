import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';


const app= express();
dotenv.config(); 

app.set("view engine","ejs"); 
app.use(express.static("public"));
app.set("views" , path.resolve("./views"));

app.use("/user", userRoutes);

app.get("/", (req, res)=> {
    res.render("home");
})

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
});


