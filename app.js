var createError = require('http-errors');
const sequelize = require('./config/db');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("dotenv").config();
var cors = require("cors");
var indexRouter = require('./routes/index');
var apiRouter = require("./routes/api/index");
var adminApiRouter = require("./routes/admin");
var app = express();


app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.static('yolov5'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

sequelize    
  .authenticate()    
  .then(() => {    
    console.log('Connection has been established successfully.');    
  })    
  .catch(err => {    
    console.error('Unable to connect to the database:', err);    
  });    

app.get('/home', (req,res) => {
  res.sendFile(__dirname+'/home.html');
});

app.use('/', indexRouter);
app.get('/test', (req,res)=>{
    res.status(200).json({
        "message":"hhgh"
    });
});
app.use("/api/", apiRouter);
app.use("/admin/", adminApiRouter);
function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
 app.get('/socket-test', (req, res) => {
  res.sendFile(__dirname+'/index.html');
});

io.on("connection", (socket) => {
  socket.on("send-message", async (data) => {
    io.emit("receive-message",data);
  });
  socket.on("user-send-message-coach", async (data) => {
    io.emit("user-receive-message-coach",data);
  });

  socket.on("player-send-message-coach", async (data) => {
    io.emit("player-receive-message-coach",data);
  });
  socket.on("player-send-message-user", async (data) => {
    io.emit("player-receive-message-user",data);
  });
});

  io.listen(server,{
    cors: {
      origin: "*",
      credentials: false
    }
  });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
server.listen(port);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;