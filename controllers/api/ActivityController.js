const ActivityModel = require("../../models/Activity");
const apiResponse = require("../../helpers/apiResponse");
const auth = require("../../middlewares/jwt");
const { body, validationResult } = require("express-validator");
const sequelize = require("../../config/db");
var exec = require("child_process").exec;
const { Op, Model } = require("sequelize");
var path = require("path");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { DATE } = require("sequelize");
const { type } = require("os");
const fs = require("fs");
const fsv = require("fs-extra");

const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let path = `./public/ActivityVideo/`;
        fsv.mkdirsSync(path);
        cb(null, path);
    },
    filename: function (req, file, cb) {
        cb(
            null,
            Math.floor(Math.random() * 10000) +
            Date.now() +
            path.extname(file.originalname)
        );
    },
});

function fileFilter(req, file, cb) {
    const extension = file.mimetype.split("/")[0];
    if (extension !== "video") {
        console.log(extension, "dssssssssssss");
        return cb(console.log("Something went wrong"), false);
    }
    cb(null, true);
}
const videoUpload = multer({
    storage: videoStorage,
    fileFilter: fileFilter,
});

exports.CreateVideo = [
    videoUpload.single("video"),
    auth,
    body("title").trim().isLength({ min: 1 }).withMessage("title  is required"),
    body("video_type")
        .trim()
        .isLength({ min: 1 })
        .withMessage("video_type  is required"),
    body("user_Type")
        .trim()
        .isLength({ min: 1 })
        .withMessage("user_Type  is required"),
    body("description")
        .trim()
        .isLength({ min: 1 })
        .withMessage("description  is required"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            console.log("errors", errors);
            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(
                    res,
                    "Validation Error.",
                    errors.array()
                );
            }
            if (req.file) {
                if (req.file.mimetype.indexOf("video/") > -1) {
                    const data = {
                        user_id: req.user.id,
                        title: req.body.title,
                        video_type: req.body.video_type,
                        description: req.body.description,
                        user_type: req.body.user_Type,
                        // video: req.file.filename,
                    };
                    const [folderName] = req.file.filename.split(".");
                    const fileName = folderName + ".webm";
                    data.video = fileName;
                    data.path = folderName;
                    data.video = data.video;
                    const result = await ActivityModel.create(data);
                    if (result) {
                        console.log("Procesing.....");
                        exec(
                            `python yolov5/detect.py --weights yolov5/best.pt --source ./public/ActivityVideo/${req.file.filename} --project ./public/output/${folderName} `,
                            (error, stdout, stderr) => {
                                if (error) {
                                    console.log(`error: ${error.message}`);
                                    return apiResponse.ErrorResponse(res, error);
                                }
                                if (stderr) {
                                    console.log("stderr", stderr);
                                    return apiResponse.successResponse(res, stderr);
                                }
                                console.log(stdout);
                                return apiResponse.successResponse(res, stdout);
                            }
                        );
                    }
                } else {
                    return apiResponse.ErrorResponse(res, "Please Select A Video");
                }
            } else {
                return apiResponse.ErrorResponse(res, "Please Select A Video");
            }
        } catch (error) {
            console.log(error);
            return apiResponse.ErrorResponse(res, error);
        }
    },
];

exports.CountVideo = [
    auth,
    async (req, res) => {
        try {
            const shots = await ActivityModel.count({
                where: { video_type: "Shots" },
            });
            const balls = await ActivityModel.count({
                where: { video_type: "Balls" },
            });
            const table = await ActivityModel.count({
                where: { video_type: "Table" },
            });
            const swing = await ActivityModel.count({
                where: { video_type: "Swings" },
            });
            const serve = await ActivityModel.count({
                where: { video_type: "Serve" },
            });
            const fileData = await ActivityModel.findAll({
                attributes: [
                    "title",
                    "description",
                    [
                        sequelize.literal(
                            "CONCAT('" +
                            process.env.IMAGEURL +
                            "output/" +
                            "',path,'/exp/',video)"
                        ),
                        "video",
                    ],
                ],
                limit: 4,
            });
            const data = {
                slider: fileData,
                list: [
                    {
                        name: "Shots",
                        count: shots,
                    },
                    {
                        name: "Balls",
                        count: balls,
                    },
                    {
                        name: "Table",
                        count: table,
                    },
                    {
                        name: "Swings",
                        count: swing,
                    },
                    {
                        name: "Serve",
                        count: serve,
                    },
                ],
            };
            return apiResponse.successResponseWithData(
                res,
                "Counting list of videos",
                data
            );
        } catch (error) {
            console.log(error);
            return apiResponse.ErrorResponse(res, error);
        }
    },
];

exports.getBallVideos = [
    auth,
    async (req, res) => {
        try {
            let type;
            if (req.query.keyWord == "Shots") {
                type = "Shots";
            }
            if (req.query.keyWord == "Balls") {
                type = "Balls";
            }
            if (req.query.keyWord == "Table") {
                type = "Table";
            }
            if (req.query.keyWord == "Swings") {
                type = "Swings";
            }
            if (req.query.keyWord == "Serve") {
                type = "Serve";
            }
            console.log("type", type);
            const getvideo = await ActivityModel.findAndCountAll({
                attributes: [
                    "id",
                    "user_Id",
                    "user_type",
                    "video_type",
                    "description",
                    [
                        sequelize.literal(
                            "CONCAT('" +
                            process.env.IMAGEURL +
                            "output/" +
                            "',path,'/exp/',video)"
                        ),
                        "video",
                    ],
                ],
                where: {
                    video_type: type,
                },
            });
            if (getvideo.count == 0) {
                console.log(getvideo);
                return apiResponse.notFoundResponse(res, "Data Not available");
            } else {
                return apiResponse.successResponseWithData(
                    res,
                    "List of Shots Video",
                    getvideo
                );
            }
        } catch (error) {
            console.log(error);
            return apiResponse.ErrorResponse(res, error);
        }
    },
];



exports.link = [
    async (req, res) => {
        try {
            link = req.body.link;
            console.log("link", link);
            exec(
                `python yolov5/detect.py --weights yolov5/best.pt --source ${link}`,
                (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return apiResponse.successResponse(res, error);
                    }
                    if (stderr) {
                        console.log("stderr", stderr);
                        return apiResponse.successResponse(res, stderr);
                    }
                    console.log(stdout);
                    return apiResponse.successResponse(res, stdout);
                }
            );
        } catch (error) {
            console.log(error);
            return apiResponse.ErrorResponse(res, error);
        }
    },
];
