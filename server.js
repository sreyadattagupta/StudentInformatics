const express=require('express');
const mongoose=require('mongoose');
const path=require('path');
const bodyParser=require('body-parser');
const fs=require('fs');
const app=express();
const cors=require('cors');
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static('frontend'));
const auth=require('./middleware/auth')

require('dotenv').config()
app.use(bodyParser.urlencoded({ extended: true }));


const dbURI = process.env.DB_URI;
const port = process.env.PORT || 3001;

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then((res)=>console.log("Connected to MongoDB database"))
.catch((err)=>console.log("Error in connection to MongoDB"))



const adminAuthRoutes = require('./routes/adminAuth');
const studentAuthRoutes = require('./routes/studentAuthRoutes');
app.get('/admin/login',(req,res)=>{
    res.sendFile(__dirname +'/frontend/loginpage.html');
})
app.use('/admin',adminAuthRoutes);
app.use('/student',studentAuthRoutes);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    }
);


//Temporary part to be replaced by dashboard page

app.get('/',auth,(req,res)=>{
    res.redirect('/admin/dashboard');
})


module.exports= app;