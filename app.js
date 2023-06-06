const express = require("express");
const multer = require("multer")
const app = express();
const port = 5000;
require('dotenv').config();
const cors = require('cors');

const routes = require('./routes/routes')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(multer().any())
app.use(cors());


app.use('/', routes)



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });