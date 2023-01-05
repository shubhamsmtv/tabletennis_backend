var express = require("express");
const notificationController = require('../../controllers/admin/NotificationController');

var router = express.Router();

router.post("/sendMessage", notificationController.sendMessage);

module.exports = router;