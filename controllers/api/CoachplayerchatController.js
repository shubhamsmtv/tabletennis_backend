const coachplayerchatModel = require("../../models/coachplayerchat");
const recentchatModel = require("../../models/coachplayerrecentchat");
const sequelize = require("../../config/db");
const apiResponse = require("../../helpers/apiResponse");
const auth = require("../../middlewares/jwt");
const { body, validationResult, check } = require("express-validator");
const fileUpload = require("express-fileupload");
var filemidlleware = fileUpload();
const path = require("path");
exports.playersendmessage = [
  auth,
  filemidlleware,
  check("receiver_id")
    .trim()
    .notEmpty()
    .withMessage("receiver_id  is Required")
    .isInt()
    .withMessage("Must be only Integer"),
  body("type")
    .isIn(["image", "video", "text"])
    .withMessage("Please send valid message type.")
    .custom((type, { req }) => {
      return new Promise(async (resolve, reject) => {
        var bodyData = req.body;
        if (type == "text") {
          if (
            typeof bodyData.message != "undefined" &&
            bodyData.message != null &&
            bodyData.message != ""
          ) {
            return resolve(true);
          } else {
            return reject("Message is required");
          }
        } else if (type == "image") {
          if (!req.files) {
            return reject("Image is required");
          } else {
            const image = req.files.message;
            console.log(image, "sdfaefd");
            if (image.mimetype.indexOf("image/") > -1) {
              var filepath =
                "public/uploads/" +
                req.user.id +
                Date.now() +
                path.extname(image.name);
              await image.mv(filepath, image);
              req.body.message = filepath;
              return resolve(true);
            } else {
              return reject("file must be an image.");
            }
          }
        } else if (type == "video") {
          if (!req.files) {
            reject("Video is required");
          } else {
            var video = req.files.message;
            var filepath =
              "public/uploads/" +
              req.user.id +
              Date.now() +
              path.extname(video.name);
            await video.mv(filepath, video);
            req.body.message = filepath;
            return resolve(true);
          }
        }
      });
    }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array({ onlyFirstError: false })[0].msg
        );
      }
      var recentChat = await recentchatModel.findOne({
        where: {
          sender_id: req.user.id,
        },
      });
      if (recentChat) {
        recentChat.message = req.body.message;
        recentChat.type = req.body.type;
        recentChat.receiver_id = req.body.receiver_id;
        recentChat.messageFrom = "player";
        recentChat.coachUnreadCount = recentChat.coachUnreadCount + 1;
        await recentChat.save();
      } else {
        await recentchatModel.create({
          sender_id: req.user.id,
          receiver_id: req.body.receiver_id,
          message: req.body.message,
          type: req.body.type,
          messageFrom: "player",
          coachUnreadCount: 1,
        });
      }
      var chat = await coachplayerchatModel.create({
        sender_id: req.user.id,
        receiver_id: req.body.receiver_id,
        message: req.body.message,
        type: req.body.type,
        messageFrom: "player",
      });
      if (req.body.type == "image" || req.body.type == "video") {
        var chat = JSON.parse(JSON.stringify(chat));
        chat.message = "http://localhost:3000/" + chat.message;
        console.log(chat.message, "sddddddddddddddddddddddddd");
      }

      return apiResponse.successResponseWithData(
        res,
        "player send message sucessfully",
        chat
      );
    } catch (err) {
      console.log(err, "dfffffffffffffffffffff");
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.coachsendmessage = [
  auth,
  filemidlleware,
  body("type")
    .isIn(["image", "video", "text"])
    .withMessage("Please send valid message type.")
    .custom((type, { req }) => {
      return new Promise(async (resolve, reject) => {
        var bodyData = req.body;
        if (type == "text") {
          if (
            typeof bodyData.message != "undefined" &&
            bodyData.message != null &&
            bodyData.message != ""
          ) {
            return resolve(true);
          } else {
            return reject("Message is required");
          }
        } else if (type == "image") {
          if (!req.files) {
            return reject("Image is required");
          } else {
            const image = req.files.message;
            if (image.mimetype.indexOf("image/") > -1) {
              var filepath =
                "public/uploads/" +
                req.user.id +
                Date.now() +
                path.extname(image.name);
              await image.mv(filepath, image);
              req.body.message = filepath;
              return resolve(true);
            } else {
              return reject("file must be an image.");
            }
          }
        } else if (type == "video") {
          if (!req.files) {
            reject("Video is required");
          } else {
            var video = req.files.message;
            var filepath =
              "public/uploads/" +
              req.user.id +
              Date.now() +
              path.extname(video.name);
            await video.mv(filepath, video);
            req.body.message = filepath;
            return resolve(true);
          }
        }
      });
    }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array({ onlyFirstError: false })[0].msg
        );
      }
      var recentChat = await recentchatModel.findOne({
        where: {
          sender_id: req.user.id,
        },
      });
      if (recentChat) {
        recentChat.message = req.body.message;
        recentChat.type = req.body.type;
        recentChat.receiver_id = req.body.receiver_id;
        recentChat.messageFrom = "coach";
        recentChat.playerUnreadCount = recentChat.playerUnreadCount + 1;
        await recentChat.save();
      } else {
        await recentchatModel.create({
          sender_id: req.user.id,
          receiver_id: req.body.receiver_id,
          message: req.body.message,
          type: req.body.type,
          messageFrom: "coach",
          playerUnreadCount: 1,
        });
      }
      var chat = await coachplayerchatModel.create({
        sender_id: req.user.id,
        receiver_id: req.body.receiver_id,
        message: req.body.message,
        type: req.body.type,
        messageFrom: "coach",
      });
      if (req.body.type == "image" || req.body.type == "video") {
        var chat = JSON.parse(JSON.stringify(chat));
        chat.message = "http://localhost:3000/" + chat.message;
        console.log(chat.message, "sddddddddddddddddddddddddd");
      }

      return apiResponse.successResponseWithData(
        res,
        "player send message sucessfully",
        chat
      );
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getchat = [
  auth,
  filemidlleware,
  async (req, res) => {
    try {
      var chatdata = await sequelize.query(
        "SELECT * FROM `coachplayerchats` WHERE ( sender_id=" +
        req.user.id +
        " AND receiver_id =" +
        req.body.receiver_id +
        " ) OR (sender_id =" +
        req.body.receiver_id +
        " AND receiver_id = " +
        req.user.id +
        ") ORDER BY coachplayerchats.id DESC",
        { type: sequelize.QueryTypes.SELECT }
      );
      return apiResponse.successResponseWithData(
        res,
        "sucessfully reterive the information",
        chatdata
      );
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.GetcoachChatlist = [
  auth,
  async (req, res) => {
    try {
      var recentChat = await recentchatModel.findOne({
        where: { sender_id: req.user.id },
      });
      if (recentChat) {
        recentChat.playerUnreadCount = 0;
        await recentChat.save();
      }
      var limit = 10;
      var offest = 0;
      if (typeof req.query.page != "undefined" && req.query.page > 1) {
        offest = (req.query.page - 1) * limit;
      }
      var totalRecords = await coachplayerchatModel.count({
        where: { sender_id: req.user.id },
      });
      var next_page = false;
      if (offest + limit < totalRecords) {
        next_page = true;
      }
      var records = await coachplayerchatModel.findAll({
        attributes: [
          "id",
          "sender_id",
          "receiver_id",
          "type",
          "messageFrom",
          "createdAt",
          "updatedAt",
          [
            sequelize.literal(
              "IF(type='image' || type='video',CONCAT('" +
              process.env.IMAGEURL +
              "',message),message)"
            ),
            "message",
          ],
        ],
        where: { sender_id: req.user.id },
        order: [["id", "DESC"]],
        limit: limit,
        offset: offest,
      });
      if (records.length) {
        return apiResponse.successResponseWithData(
          res,
          "sucessfully reterive the informatiom",
          { records, count: totalRecords, nextPage: next_page }
        );
      } else {
        return apiResponse.successResponseWithData(
          res,
          "something went wrong",
          { records, count: totalRecords, nextPage: false }
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.GetplayerChatlist = [
  auth,
  async (req, res) => {
    try {
      var recentChat = await recentchatModel.findOne({
        where: { sender_id: req.user.id },
      });
      if (recentChat) {
        recentChat.coachUnreadCount = 0;
        await recentChat.save();
      }
      var limit = 10;
      var offest = 0;
      if (typeof req.query.page != "undefined" && req.query.page > 1) {
        offest = (req.query.page - 1) * limit;
      }
      var totalRecords = await coachplayerchatModel.count({
        where: { sender_id: req.user.id },
      });
      var next_page = false;
      if (offest + limit < totalRecords) {
        next_page = true;
      }
      var records = await coachplayerchatModel.findAll({
        attributes: [
          "id",
          "sender_id",
          "receiver_id",
          "type",
          "messageFrom",
          "createdAt",
          "updatedAt",
          [
            sequelize.literal(
              "IF(type='image' || type='video',CONCAT('" +
              process.env.IMAGEURL +
              "',message),message)"
            ),
            "message",
          ],
        ],
        where: { sender_id: req.user.id },
        order: [["id", "DESC"]],
        limit: limit,
        offset: offest,
      });
      if (records.length) {
        return apiResponse.successResponseWithData(
          res,
          "sucessfully reterive the informatiom",
          { records, count: totalRecords, nextPage: next_page }
        );
      } else {
        return apiResponse.successResponseWithData(
          res,
          "something went wrong",
          { records, count: totalRecords, nextPage: false }
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
