var express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var logger = require('morgan')
var errorHandler = require('errorhandler')

var app = express()
var dbUri = 'mongodb://localhost:27017/api'
var dbConnection = mongoose.createConnection(dbUri)
var Schema = mongoose.Schema

var postSchema = new Schema ({
  title: {
    type: String,
    required: true,
    trim: true,
    match: /^([\w ,.!?]{1,100})$/
  },
  text: {
    type: String,
    required: true,
    max: 2000
  },
  viewCounter: Number,
  published: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
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
  post.validate(function(error){
    console.log(error)
    if (error) return next(error)
    post.save(function(error, results){
      if (error) return next(error)
      res.send(results)
    })
  })
})

app.use(errorHandler())

var server = require('http').createServer(app).listen(3000)