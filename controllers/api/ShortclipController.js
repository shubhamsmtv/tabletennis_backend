const ShortclipModel = require("../../models/shortclip");
const auth = require("../../middlewares/jwt");
const { body, validationResult, check } = require("express-validator");
const sequelize = require("../../config/db");
const multer = require("multer");
var path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const apiResponse = require("../../helpers/apiResponse");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
require("dotenv").config();

exports.clip_list = [
  auth,
  async (req, res) => {
    try {
      const clipsData = await ShortclipModel.findAll({
        attributes: [
          "id", "title", "description", "createDate", "updateDate",
          [sequelize.literal("CONCAT('" + process.env.VIDEOURL + "shortClipVideos/" + "',video)"), "video",],
        ],
      });
      if (!clipsData) {
        return apiResponse.notFoundResponse(res, "Short clips Data is empty");
      }
      return apiResponse.successResponseWithData(
        res,
        "Successfully retrieve information of ShortClip's video",
        clipsData
      );
    } catch (error) {
      console.log(error);
      return apiResponse.ErrorResponse(res, error);
    }
  }
]



