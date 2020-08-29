'use strict';
const {postInsta} = require('./instaBot');  
const express = require('express');
const PORT = 8080;
const HOST = '0.0.0.0';
const app = express();
app.get('/', async (req, res) => {
  const params = req.query;
  const totalPosted = await postInsta({params});
  res.send(`totalPosted: ${totalPosted}`);
});
app.listen(PORT, HOST);
