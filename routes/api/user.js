var express = require("express");
const UserController = require("../../controllers/api/UserController");
var router = express.Router();

// router.get("/detail", UserController.detail);
router.get("/detail", UserController.detail);
router.post("/update", UserController.update);
router.post("/change-password", UserController.changePassword);
// router.post("/upload-image", UserController.uploadImage)
router.post("/update-image", UserController.updateImage);
router.get("/subscription_Details", UserController.sub_Details)

module.exports = router;