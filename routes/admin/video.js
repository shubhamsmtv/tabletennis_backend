var express = require("express");
const ShortclipController = require("../../controllers/admin/ShortclipController");
var router = express.Router();
// router.post("/uploadvideo", ShortclipController.uploadvideo);
// router.post("/approvelist", ShortclipController.approvelist);
// router.get("/user-info", ShortclipController.info_user);
// router.post("/disableupdate", ShortclipController.Disable_update);
// router.post("/disablevideolist", ShortclipController.disablelist);
// router.post("/deletevideo", ShortclipController.deleteVideo);



router.post("/add_Short_Clips", ShortclipController.Create_video);
router.get("/list/:page", ShortclipController.list);
router.get("/listById/:videoId", ShortclipController.list_By_Id);
router.post("/update/", ShortclipController.update);
router.delete("/delete/:videoId", ShortclipController.deleteVideo);



module.exports = router;    