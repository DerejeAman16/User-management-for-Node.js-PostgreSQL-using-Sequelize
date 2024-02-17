const cors = require('cors');
const express = require("express");
const bodyParser = require("body-parser");
const testAccount = require("./config/TestAccounts");
require("dotenv").config();

const app = express();
app.use(cors());
/* app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); */
app.use(express.json());
//require("./router")(app);
const register = require("./router/index");
app.use('/register', register)
 
app.listen(process.env.PORT, () => {
  console.log(`Server is listening to port ${process.env.PORT}`);
});