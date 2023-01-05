var express = require("express");
var authRouter = require("./auth");
var articlerouter = require("./article");
var promotionrouter = require("./promotion");
var userRouter = require("./user");

var  subscriptionrouter = require("./subscription");
var  videorouter = require("./video");
var apiResponse = require("../../helpers/apiResponse");
const notificationrouter = require('./notificationRouter');
var app = express();

// app.get("/", function(req, res) {
// 	res.render("index", { title: "Mimoji api" });
// });

app.use("/auth/", authRouter);
app.use("/user/", userRouter);
app.use("/article/", articlerouter);
// app.use("/adminvideo/", videorouter);
app.use("/sortClips/", videorouter);
app.use("/subscription/", subscriptionrouter);
app.use("/promotion/", promotionrouter);
app.use("/notification", notificationrouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
	return apiResponse.notFoundResponse(res, "The server has not found anything matching the Request-URI");
});

app.use(function (err, req, res, next) {
	if (err.name === 'UnauthorizedError') {
	  return apiResponse.unauthorizedResponse(res, err.message);
	}
});

module.exports = app;