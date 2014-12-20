var express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var logger = require('morgan')

var app = express()
var dbUri = 'mongodb://localhost:27017/api'
var dbConnection = mongoose.createConnection(dbUri)
var Schema = mongoose.Schema
var postSchema = new Schema ({
  title: String,
  text: String
})
var Post = dbConnection.model('Post', postSchema, 'posts')
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', function(req, res){
  res.send('ok')
})

app.get('/posts', function(req, res, next){
  Post.find({}, function(error, posts){
    if (error) return next(error)
    res.send(posts)
  })
})

app.post('/posts', function(req, res, next){
  var post = new Post (req.body)
  post.save(function(error, results){
    if (error) return next(error)
    res.send(results)
  })
})

var server = require('http').createServer(app).listen(3000)