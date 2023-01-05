var express = require("express");
const paymentController = require("../../controllers/api/paymetController");

var router = express.Router();
router.post("/create_Payment", paymentController.create_Payment);
router.post("/payment_sheet", paymentController.payment_sheet);
router.post("/Success_Payment", paymentController.Success_payment);
router.get("/Check_Sub", paymentController.check_Sub);

module.exports = router;