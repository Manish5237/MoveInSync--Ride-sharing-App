require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const logger = require('./logger');
const port = process.env.PORT

const mongoLink= process.env.MONGO_LINK;
const app = express();
app.listen(port ,()=>{
    logger.info(`Server is running on ${port}`);
});

mongoose.connect(mongoLink)
.then(() => {
    logger.info("Connected to the Database");
}).catch((err) => {
    logger.error("Error connecting to database",err);   
});

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/trips", require("./routes/tripRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));