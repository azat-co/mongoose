var express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var logger = require('morgan')
var errorHandler = require('errorhandler')
var ok = require('okay');

var app = express()
var dbUri = process.env.MONGOHQ_URL || 'mongodb://localhost:27017/api'
var dbConnection = mongoose.createConnection(dbUri)
var Schema = mongoose.Schema

var enumRoles = ['user', 'admin', 'staff']
var positiveNum = function(value) {
  if (value<0) {
    return false
  } else {
    return true
  }
}
var postSchema = new Schema ({
  title: {
    type: String,
    required: true,
    trim: true,
    match: /^([\w ,.!?]{1,100})$/,
    set: function(value) {
      return value.toUpperCase()
    },
    get: function(value) {
      return value.toLowerCase()
    }
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
  viewCounter: {
    type: Number
  },
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


postSchema.path('viewCounter').validate(positiveNum)
postSchema.virtual('hasComments').get(function(){
  return this.comments.length>0
})


postSchema.pre('save', function(next){
  this.updatedAt = new Date
  next()
})
postSchema.pre('validate', function(next){
  var error = null
  if (this.isModified('comments') && this.comments.length>0) {
    this.comments.forEach(function(value, key, list){
      if (!value.text || !value.author.id) {
        error = new Error('Text and author for a comment must be set')
      }
    })
  }
  if (error) return next(error)
  next()
})
var Post = dbConnection.model('Post', postSchema, 'posts')
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', function(req, res){
  res.send('ok')
})

app.get('/posts', function(req, res, next){
  Post.find({}, 'id title', {limit: 100, sort: {_id: 1}}, ok(next, function(posts){
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
    res.send(post.toJSON({getters: true, virtuals: true}))
  }))
})

app.put('/posts/:id', function(req, res, next){
  Post.findOne({_id: req.params.id}, ok(next, function(post){
    post.set(req.body)
    post.save(ok(next, function(post){
      res.send(post.toJSON({getters: true}))
    }))
  }))
})

app.delete('/posts/:id', function(req, res, next) {
  Post.findOne({_id: req.params.id}, ok(next, function(post){
    post.remove(ok(next, function(results){
      res.send(results)
    }))
  }))
})

app.use(errorHandler())

var server = require('http').createServer(app).listen(3000)