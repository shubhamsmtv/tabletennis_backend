var express = require("express");
const ShortclipControllerApi = require("../../controllers/api/ShortclipController");
var router = express.Router();


router.get("/clip_list", ShortclipControllerApi.clip_list);
// router.post("/deletevideo", ShortclipControllerApi.deleteVideo);

module.exports = router;
