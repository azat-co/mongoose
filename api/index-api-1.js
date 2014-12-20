var express = require('express')
var mongoose = require('mongoose')

var app = express()

app.get('/', function(req, res){
  res.send('ok')
})

var server = require('http').createServer(app).listen(3000)