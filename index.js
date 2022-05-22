const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());


















app.get("/", (req, res) => {
    res.send("Hello from Textile Industrial Tools and Equipment!");
  });
  
  app.listen(port, () => {
    console.log(`Textile Industrial Tools and Equipment app listening on port: ${port}`);
  });
  