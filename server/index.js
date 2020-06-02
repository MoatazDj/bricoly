require('dotenv').config();
const express = require('express');
const cors = require('cors');
const router = require('./routers');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// routes
app.use('/auth', router.auth);

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server listening on port : ${port} ..`);
});