const PromotionvideoModel = require("../../models/promotionvideo");
const auth = require("../../middlewares/jwt");
const { body, validationResult, check } = require("express-validator");
const sequelize = require("../../config/db");
const { Op } = require("sequelize");
const apiResponse = require("../../helpers/apiResponse");
require("dotenv").config();
const fs = require('fs')

exports.list = [
  auth,
  async (req, res) => {
    try {
      const { pageNumber, pageSize, q } = req.body;

      if (pageNumber && pageSize) {
        limit = parseInt(pageSize);
        offset = limit * (pageNumber - 1);
      } else {
        limit = parseInt(10);
        offset = limit * (1 - 1);
      }
      if (q) {
        var search = {};
        search[Op.or] = {
          title: { [Op.substring]: q.trim() },
          //  content : {[Op.substring]: q.trim()},
        };
      }
      const { count, rows: user } = await PromotionvideoModel.findAndCountAll({
        offset,
        limit,
        order: [["id", "DESC"]],
        attributes: [
          "id",
          "title",
          "description",
          "createdat",
          "updatedat",
          [
            sequelize.literal(
              "CONCAT('" + process.env.VIDEOURL + "promotionVideos/" + "',video)"
            ),
            "video",
          ],
        ],
        where: {
          ...search,
        },
      });

      let next_page = false;
      if (offset + limit < count) {
        next_page = true;
      }

      if (!user) {
        return apiResponse.ErrorResponse(res, "Something went wrong", user);
      }
      return apiResponse.successResponseWithData(
        res,
        "Successfully retrieve information of promoption video uploded by admin",
        { user, count, next_page }
      );
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];


exports.list_by_userId = [
  auth,
  async (req, res) => {
    try {
      const user_id = req.user.id
      console.log('user', user_id)
      if (user_id) {
        const videoData = await PromotionvideoModel.findAll({
          attributes: [
            "id",
            "title",
            "description",
            "createdat",
            "updatedat",
            [
              sequelize.literal(
                "CONCAT('" + process.env.VIDEOURL + "promotionVideos/" + "',video)"
              ),
              "video",
            ],
          ],
          where: {
            user_id: user_id
          },
        });
        if (!videoData) {
          return apiResponse.ErrorResponse(res, "Something went wrong");
        }
        return apiResponse.successResponseWithData(
          res,
          "Successfully retrieve promoption video by user ID",
          videoData
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];


exports.list_by_videoId = [
  auth,
  async (req, res) => {
    try {
      const videoId = req.params.videoId;
      console.log('videoId', videoId)
      if (videoId) {
        const videoData = await PromotionvideoModel.findOne({
          attributes: [
            "id",
            "title",
            "description",
            "createdat",
            "updatedat",
            [
              sequelize.literal(
                "CONCAT('" + process.env.VIDEOURL + "promotionVideos/" + "',video)"
              ),
              "video",
            ],
          ],
          where: {
            id: videoId
          },
        });
        if (!videoData) {
          return apiResponse.ErrorResponse(res, "Something went wrong");
        }
        return apiResponse.successResponseWithData(
          res,
          "Successfully get promoption video by ID.",
          videoData
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];


exports.delete_by_videoId = [
  auth,
  async (req, res) => {
    try {
      const videoId = req.params.videoId;
      if (videoId) {
        const getvideo = await PromotionvideoModel.findOne({ where: { id: videoId } });
        if (getvideo) {
          const videoName = getvideo.video
          const data = await PromotionvideoModel.destroy({
            where: { id: videoId },
          });
          fs.unlink('public/promotionVideos/' + videoName, function (error) {
            if (error) {
              console.log(error);
            }
          });
          if(data == 1) {
            return apiResponse.successResponseWithData(
              res,
              "video deleted sucessfully",
              data
            );
          }
        }
        else {
          return apiResponse.successResponseWithData(res, "No video found", );
        }
      }
      else{
        return apiResponse.ErrorResponse(res, "Video id is required");
      }
    } catch (err) {
      console.log(err)
      return apiResponse.ErrorResponse(res, err);
    }
  }
]


exports.update = [
  auth,
  async (req, res) => {
    try {
      var errors = validationResult(req);
      if (errors.isEmpty()) {
        var setdata = {
          title: req.body.title,
          description: req.body.content,
        };
        console.log(setdata);
        await PromotionvideoModel.update(setdata, {
          where: { id: req.body.id },
        });

        return apiResponse.successResponseWithData(
          res,
          " Information Updated Sucessfully"
        );
      } else {
        return apiResponse.ErrorResponse.json({
          status: "fail",
          message: errors.array({ onlyFirstError: true })[0].msg,
        });
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];