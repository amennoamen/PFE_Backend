//importation 
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const http =require("http") // importation protocol web 

require("dotenv").config() //configuration . env

var indexRouter = require('./routes/index');
var authRoutes = require('./routes/auth.routes');
var usersRouter = require('./routes/users.routes');

var app = express();

const {testPostgresConnection } =require("./config/database")



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);  // ← Nouvelle route

app.use('/', indexRouter);

app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json('error');
});

const server=http.createServer(app)
server.listen(process.env.Port,()=>{
  console.log("app is running on prot 5000")
  testPostgresConnection()
 
})
