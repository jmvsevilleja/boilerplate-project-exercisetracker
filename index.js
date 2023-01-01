const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
var bodyParser = require('body-parser');

let mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

let UserSchema = new mongoose.Schema({
  username: String,
});
let ExcerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model("User", UserSchema);
const Excercise = mongoose.model("Excercise", ExcerciseSchema);

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res, next) => {
  console.log('/api/users body', req.body);
  const newUser = new User({
    username: req.body.username
  });
  newUser.save((err, data) => {
    if (err || !data) {
      return next("Error saving user");
    }
    res.json(data);
  });
});

app.get('/api/users', (req, res, next) => {
  console.log('/api/users query params', req.query, req.params);
  User.find().exec((err, data) => {
    if (err || !data) {
      return res.json([]);
    }
    res.json(data);
  });
});

app.post('/api/users/:_id/exercises', (req, res, next) => {
  console.log('/api/users/:_id/exercises params body', req.params, req.body);
  const id = req.params._id;
  const {description, duration, date} = req.body;
  User.findById(id, (err, userData) => {
    if (err || !userData) {
      return next("Error finding user");
    }
    const newExcercise = new Excercise({
      userId: id,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    });
    newExcercise.save((err, data) => {
      if (err || !data) {
        return next("Error saving excercise");
      }
      const {description, duration, date} = data;
      res.json({
        username: userData.username,
        description,
        duration,
        date: date.toDateString(),
        _id: userData._id
      });
    });
  });
});

app.get('/api/users/:_id/logs', (req, res, next) => {
  console.log('/api/users/:_id/logs query params', req.query, req.params);
  const {from, to, limit} = req.query;
  const id = req.params._id;
  User.findById(id, (err, userData) => {
    if (err || !userData) {
      return next("Error finding user");
    }
    let filter = {
      userId: id,
    }
    if (from || to) {
      let dateObj = {}
      if (from) {
        dateObj["$gte"] = new Date(from);
      }
      if (to) {
        dateObj["$lte"] = new Date(to);
      }
      filter.date = dateObj
    }
    let limits = limit ?? 500;
    console.log('filter limits', filter, limits);
    Excercise.find(filter).limit(limits).exec((err, data) => {
      if (err || !userData) {
        return res.json([]);
      }
      const count = data.length;
      const {username, _id} = userData;
      const log = data.map(({description, duration, date}) => ({
        description,
        duration,
        date: date.toDateString()
      }));
      console.log('logs', {_id, username, count, log});
      res.json({_id, username, count, log});
    });

  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
