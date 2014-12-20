var express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var logger = require('morgan')
var errorHandler = require('errorhandler')
var ok = require('okay');

var app = express()
var dbUri = 'mongodb://localhost:27017/api'
var dbConnection = mongoose.createConnection(dbUri)
var Schema = mongoose.Schema

var enumRoles = ['user', 'admin', 'staff']

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
  followers: [Schema.Types.ObjectId],
  meta: Schema.Types.Mixed,
  comments: [{
    text: {
      type: String,
      trim: true,
      max: 2000,
    },
    author: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      role: {
        type: String,
        enum: enumRoles
      }
    }
  }],
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
  Post.find({}, ok(next, function(posts){
    res.send(posts)
  })
  )
})

app.post('/posts', function(req, res, next){
  var post = new Post (req.body)
  post.validate(ok(next, function(error){
    post.save(ok(next, function(results){
      res.send(results)
    })
  )})
  )
})

app.get('/posts/:id', function(req, res, next){
  Post.findOne({_id: req.params.id}, ok(next, function(post){
    res.send(post.toJSON())
  }))
})

app.put('/posts/:id', function(req, res, next){
  Post.findOne({_id: req.params.id}, ok(next, function(post){
    post.set(req.body)
    post.save(ok(next, function(post){
      res.send(post.toJSON())
    }))
  }))
})

app.use(errorHandler())

var server = require('http').createServer(app).listen(3000)