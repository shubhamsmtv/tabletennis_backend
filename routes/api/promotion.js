var express = require("express");
const PromotionvideoController = require("../../controllers/api/PromotionvideoController");
var router = express.Router();
router.get("/list", PromotionvideoController.list);
router.get("/list_by_userId", PromotionvideoController.list_by_userId);
router.get("/list_by_videoId/:videoId", PromotionvideoController.list_by_videoId);
router.delete("/delete_by_videoId/:videoId", PromotionvideoController.delete_by_videoId)
router.post("/update_by_videoId", PromotionvideoController.update)

module.exports = router;