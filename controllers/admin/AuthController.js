const admin = require("../../models/super_admin.js");
const UserModel = require("../../models/user");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
var path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");

const apiResponse = require("../../helpers/apiResponse");
const auth = require("../../middlewares/jwt");
const utility = require("../../helpers/utility");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("../../helpers/mailer");
const { Op } = require("sequelize");
const { constants } = require("../../helpers/constants");
require("dotenv").config();

//Admin Login
exports.login = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email must not be empty")
    .isLength({ min: 1 })
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address."),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password must not be empty")
    .isLength({ min: 1 })
    .withMessage("Password must be specified."),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        const { email, password: pass } = req.body;
        const user = await admin.findOne({ where: { email: email } });
        if (!user) {
          return apiResponse.unauthorizedResponse(
            res,
            "Incorrect email address!"
          );
        }
        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
          return apiResponse.ErrorResponse(res, "Incorrect password!");
        }
        let userData = {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        // user matched!
        const secretKey = process.env.JWT_SECRET || "";
        userData.token = jwt.sign({ id: user.id.toString() }, secretKey, {
          expiresIn: process.env.JWT_TIMEOUT_DURATION,
        });
        return apiResponse.successResponseWithData(
          res,
          "LoggedIn successfully.",
          userData
        );
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

//Forgot Password For Admin
exports.forgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email must not be empty")
    .isLength({ min: 1 })
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address."),
  body("email").escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        const { email } = req.body;
        const user = await admin.findOne({ where: { email: email } });
        if (user) {
          // Generate otp
          let otp = utility.randomNumber(6);
          // Html email body
          let html = "<p>Waldner Verification code</p><p>OTP: " + otp + "</p>";
          // Send confirmation email
          mailer
            .send(
              `walnder <${constants.confirmEmails.from}>`,
              req.body.email,
              "Waldner - OTP",
              html
            )
            .then(async function () {
              const result = await admin.update(
                { otp: otp },
                { where: { id: user.id } }
              );
              if (!result) {
                return apiResponse.unauthorizedResponse(
                  res,
                  "Something went wrong!"
                );
              }
              return apiResponse.successResponse(res, "OTP sent successfully.");
            });
        } else {
          return apiResponse.unauthorizedResponse(
            res,
            "Specified email not found."
          );
        }
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

//Verify OTP for Admin
exports.verifyOtp = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email must not be empty")
    .isLength({ min: 1 })
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address."),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP must not be empty")
    .isLength({ min: 1 })
    .withMessage("OTP must be specified."),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        const { email, otp } = req.body;
        const user = await admin.findOne({ where: { otp: otp, email: email } });
        if (user) {
          return apiResponse.successResponse(res, "OTP verified successfully.");
        } else {
          return apiResponse.unauthorizedResponse(
            res,
            "Specified OTP not found."
          );
        }
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

//Reset Password For Admin
exports.resetPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email must not be empty")
    .isLength({ min: 1 })
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address."),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password must not be Empty")
    .isLength({ min: 6 })
    .withMessage("Password must be 6 characters or greater."),
  body("confirm-password")
    .notEmpty()
    .withMessage("Confirm Password must not be empty")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm Password Doesn't match to your Password");
      }
      return true;
    }),
  body("password").escape(),
  body("otp").escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        const { email, otp } = req.body;
        const user = await admin.findOne({ where: { email: email } });
        if (user) {
          if (req.body.password) {
            const pass = await bcrypt.hash(req.body.password, 10);
            const result = await admin.update(
              { password: pass, otp: null },
              { where: { id: user.id } }
            );
            if (!result) {
              return apiResponse.unauthorizedResponse(
                res,
                "Something went wrong!"
              );
            }
            return apiResponse.successResponse(
              res,
              "Password reset successfully."
            );
          } else {
            return apiResponse.unauthorizedResponse(
              res,
              "Something went wrong!"
            );
          }
        } else {
          return apiResponse.unauthorizedResponse(res, "Invalid email");
        }
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let path = `./public/uploads/`;
    fs.mkdirsSync(path);
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      "" + uuidv4() + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const videoUpload = multer({
  storage: videoStorage,
});

//Article Videos Upload
exports.upload = [
  auth,
  videoUpload.single("video"),
  async (req, res) => {
    console.log(req);
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      }
      const { filename: video } = req.file;
      let infoVideo = {
        video: req.file.filename,
      };
      console.log(infoVideo);
      const uploadVideo = await UserModel.create(infoVideo);
      infoVideo.video = process.env.VIDEOURL + "uploads/" + uploadVideo.video;
      return apiResponse.successResponseWithData(
        res,
        "Article  video uploaded Sucessfully",
        infoVideo
      );
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
