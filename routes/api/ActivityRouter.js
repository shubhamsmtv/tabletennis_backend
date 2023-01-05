var express = require("express");
const ActivityController = require("../../controllers/api/ActivityController");

var router = express.Router();
router.post("/CreateVideo", ActivityController.CreateVideo);
router.get("/CountVideo", ActivityController.CountVideo);
router.get('/getBallVideos', ActivityController.getBallVideos);
// router.post('/link', ActivityController.link);

module.exports = router;