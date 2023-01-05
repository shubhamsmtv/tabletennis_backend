const ShortclipModel = require("../../models/shortclip");
const users = require("../../models/user");
const auth = require("../../middlewares/jwt");
const { body, validationResult } = require("express-validator");
const sequelize = require("../../config/db");;
const path = require("path");
const fs = require("fs-extra");
const apiResponse = require("../../helpers/apiResponse");
const { Op } = require("sequelize");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");


const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let path = `./public/shortClipVideos/`;
    fs.mkdirsSync(path);
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      uuidv4() + path.extname(file.originalname)
    );
  },
});


function fileFilter(req, file, cb) {
  const extension = file.mimetype.split("/")[0];
  if (extension !== "video") {
    return cb(console.log("Something went wrong"), false);
  }
  cb(null, true);
}


const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 10000000, // 10000000 Bytes = 10 MB
  },
  fileFilter: fileFilter,
});


// Short Clips Video Upload by Admin API //
exports.Create_video = [
  auth,
  videoUpload.single("video"),
  body("title").isLength({ min: 1 }).trim().withMessage("title  is required"),
  body("description").isLength({ min: 1 }).trim().withMessage("description  is required"),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      console.log("errors", errors);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error",    
          errors.array()
        );
      }
      console.log('fileee', req.file.video)
      const fileSize = parseInt(req.headers['content-length']);
      console.log('file', fileSize)
      if (fileSize >= 4800000) {
        return apiResponse.ErrorResponse(
          res,
          "please upload video only less then 30 second"
        );
      }
      if (req.file) {
        let infoVideo = {
          title: req.body.title,
          video: req.file.filename,
          description: req.body.description,
        };
        const uploadVideo = await ShortclipModel.create(infoVideo);
        infoVideo.video =
          process.env.VIDEOURL + "shortClipVideos/" + uploadVideo.video;
        return apiResponse.successResponseWithData(
          res,
          "ShortClip video  uploaded Sucessfully",
          infoVideo
        );
      } else {
        return apiResponse.ErrorResponse(
          res,
          "please upload only video not other files"
        );
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  }
]



exports.list = [
  auth,
  async (req, res) => {
    try {
      const page = req.params.page;
      const clipsData = await ShortclipModel.findAndCountAll({
        attributes: [
          "id", "title", "description", "createDate",
          [sequelize.fn('date_format', sequelize.col('updateDate'), '%Y-%m-%d'), 'updateDate'],
          [sequelize.literal("CONCAT('" + process.env.VIDEOURL + "shortClipVideos/" + "',video)"), "video",],
        ],
        limit : [((page-1)*5),5]
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



exports.list_By_Id = [
  auth,
  async (req, res) => {
    try {
      const videoId = req.params.videoId
      if (videoId) {
        const videoData = await ShortclipModel.findOne({
          attributes: ["id", "description", "title", "createDate", "updateDate",
            [sequelize.literal("CONCAT('" + process.env.VIDEOURL + "shortClipVideos/" + "',video)"), "video",],
          ],
          where: { id: videoId },
        });
        if (videoData) {
          return apiResponse.successResponseWithData(
            res,
            "Successfully retrieve video",
            [videoData]
          );
        }
        else {
          return apiResponse.notFoundResponse(res, "Not found");
        }
      }
      else {
        return apiResponse.ErrorResponse(
          res,
          "video Id is require"
        )
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];



exports.update = [
  auth,
  videoUpload.single("video"),
  async (req, res) => {
    try {
      const videoId = req.body.id;
      if (videoId) {
        let setData = {};
        if (req.body.title) {
          setData.title = req.body.title;
        }
        if (req.body.description) {
          setData.description = req.body.description;
        }
        if (req.file) {
          const video = req.file.filename;
          setData.video = video;
          const update = await ShortclipModel.update(setData, { where: { id: videoId } });
          setData.video =
            process.env.VIDEOURL + "shortClipVideos/" + update.video;
          return apiResponse.successResponseWithData(
            res,
            "ShortClip video update Sucessfully",
            setData
          );
        }
        else {
          const update = await ShortclipModel.update(setData, { where: { id: videoId } });
          return apiResponse.successResponseWithData(
            res,
            "ShortClip video update Sucessfully",
            update
          );
        }
      }
    } catch (error) {
      console.log(error);
      return apiResponse.ErrorResponse(res, error);
    }
  }
];




exports.deleteVideo = [
  auth,
  body("id").isLength({ min: 1 }).trim().withMessage("id is required"),
  async (req, res) => {
    console.log(req);
    try {
      const videoId = req.params.videoId;
      if (videoId) {
        const data = await ShortclipModel.destroy({
          where: { id: videoId },
        });
        if (!data) {
          return apiResponse.successResponseWithData(res, "No video found", data);
        }
        return apiResponse.successResponseWithData(
          res,
          "video deleted sucessfully",
          data
        );
      }
      else {
        return apiResponse.ErrorResponse(
          res,
          "Video id is require"
        )
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];





////////////////////////////////////////////////////////////////////////////////////
// exports.list = [
//   auth,
//   async (req, res) => {
//     try {
//       const { pageNumber, pageSize, q } = req.body;
//       if (pageNumber && pageSize) {
//         limit = parseInt(pageSize);
//         offset = limit * (pageNumber - 1);
//       } else {
//         limit = parseInt(10);
//         offset = limit * (1 - 1);
//       }
//       if (q) {
//         var search = {};
//         search[Op.or] = {
//           title: { [Op.substring]: q.trim() },
//           //  content : {[Op.substring]: q.trim()},
//         };
//       }
//       var approve = req.body.approve;
//       if (0 == approve) {
//         const { count, rows: user } = await ShortclipModel.findAndCountAll({
//           offset,
//           limit,
//           order: [["id", "DESC"]],
//           include: [
//             {
//             model: users,
//             attributes: { exclude: ["video"] },
//             attributes: ['id', 'name', 'email'],
//             }
//           ],
//           attributes: [
//             "id","user_id","approve","title","description","createdat","updatedat",
//             [sequelize.literal("CONCAT('" + process.env.VIDEOURL +"shortClipVideos/" +"',video)"),"video",],
//           ],
//           where: {
//             ...search,
//           },
//         });
//         let next_page = false;
//         if (offset + limit < count) {
//           next_page = true;
//         }
//         if (!user) {
//           return apiResponse.ErrorResponse(res, "Something went wrong", user);
//         }
//         return apiResponse.successResponseWithData(
//           res,
//           "Successfully retrieve information of uploaded video",
//           { user, count, next_page }
//         );
//       } else {
//         const { pageNumber, pageSize, q } = req.body;
//         if (pageNumber && pageSize) {
//           limit = parseInt(pageSize);
//           offset = limit * (pageNumber - 1);
//         } else {
//           limit = parseInt(10);
//           offset = limit * (1 - 1);
//         }
//         var approve = req.body.approve;
//         if ("1" == approve) {
//           const { count, rows: user } =
//             await ShortclipModel.findAndCountAll({
//               offset,
//               limit,
//               order: [["id", "DESC"]],
//               include: [{
//                 model: users,

//                 attributes: ['id', 'name', 'email'
//                 ],
//               }],
//               attributes: [
//                 "id",
//                 "user_id",
//                 "approve",
//                 "title",
//                 "description",
//                 "createdat",
//                 "updatedat",
//                 [
//                   sequelize.literal(
//                     "CONCAT('" +
//                     process.env.VIDEOURL +
//                     "shortClipVideos/" +
//                     "',video)"
//                   ),
//                   "video",
//                 ],
//               ],
//               where: { approve: "1" },
//             });
//           let next_page = false;
//           if (offset + limit < count) {
//             next_page = true;
//           }
//           if (!user.length) {
//             return apiResponse.ErrorResponse(res, "Something went wrong", user);
//           }
//           return apiResponse.successResponseWithData(
//             res,
//             "Successfully retrieve information of uploaded video",
//             { user, count, next_page }
//           );
//         }
//       }
//     } catch (err) {
//       console.log(err);
//       return apiResponse.ErrorResponse(res, err);
//     }
//   },
// ];



// exports.approvelist = [
//   auth,
//   async (req, res) => {
//     try {
//       const { pageNumber, pageSize, q } = req.body;

//       if (pageNumber && pageSize) {
//         limit = parseInt(pageSize);
//         offset = limit * (pageNumber - 1);
//       } else {
//         limit = parseInt(10);
//         offset = limit * (1 - 1);
//       }
//       if (q) {
//         var search = {};
//         search[Op.or] = {
//           title: { [Op.substring]: q.trim() },
//           description: { [Op.substring]: q.trim() },
//         };
//       }
//       // var approve = req.body.approve;
//       // console.log(approve, "dffffffffffff");
//       // if (1 == approve) {
//       const { count, rows: user } = await ShortclipModel.findAndCountAll({
//         offset,
//         limit,
//         attributes: [
//           "id",
//           "user_id",
//           "approve",
//           "disable",
//           "title",
//           "description",
//           "createdat",
//           "updatedat",
//           [
//             sequelize.literal(
//               "CONCAT('" +
//               process.env.VIDEOURL +
//               "shortClipVideos/" +
//               "',video)"
//             ),
//             "video",
//           ],
//         ],

//         // where: {
//         //   approve: "1",

//         //   ...search,
//         // },


//         where: {
//           ...search,
//           [Op.and]: [
//             { approve: "1" },
//             { disable: "0" },

//           ]
//         }
//       });

//       let next_page = false;
//       if (offset + limit < count) {
//         next_page = true;
//       }
//       if (!user) {
//         return apiResponse.ErrorResponse(res, "Something went wrong", user);
//       }
//       return apiResponse.successResponseWithData(
//         res,
//         "Successfully retrieve information of uploaded video",
//         { user, count, next_page }
//       );

//     } catch (err) {
//       console.log(err);
//       return apiResponse.ErrorResponse(res, err);
//     }
//   },
// ];







//
// exports.Disable_update = [
//   auth,
//   body("id").isLength({ min: 1 }).trim().withMessage("id is required"),
//   async (req, res) => {
//     var errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return apiResponse.validationErrorWithData(
//         res,
//         "Validation Error.",
//         errors.array()
//       );
//     }
//     var setdata = {
//       disable: req.body.disable,
//     };
//     try {
//       await ShortclipModel.update(setdata, {
//         where: { id: req.body.id },
//       });
//       var user = await ShortclipModel.findOne({
//         where: { id: req.body.id },
//       });
//       if (!user) {
//         return apiResponse.ErrorResponse(
//           res,
//           "No information  found by this user"
//         );
//       }
//       return apiResponse.successResponseWithData(
//         res,
//         "Disable request  updated sucessfully"
//       );
//     } catch (err) {
//       console.log(err);
//       return apiResponse.ErrorResponse(res, err);
//     }
//   },
// ];

// exports.deleteVideo = [
//   auth,
//   body("id").isLength({ min: 1 }).trim().withMessage("id is required"),
//   async (req, res) => {
//     console.log(req);
//     try {
//       const data = await ShortclipModel.destroy({
//         where: { id: req.body.id },
//       });

//       if (!data) {
//         return apiResponse.successResponseWithData(res, "No video found", data);
//       }

//       return apiResponse.successResponseWithData(
//         res,
//         "video deleted sucessfully",
//         data
//       );
//     } catch (err) {
//       return apiResponse.ErrorResponse(res, err);
//     }
//   },
// ];


// exports.disablelist = [
//   auth,
//   async (req, res) => {
//     try {
//       const { pageNumber, pageSize, q } = req.body;

//       if (pageNumber && pageSize) {
//         limit = parseInt(pageSize);
//         offset = limit * (pageNumber - 1);
//       } else {
//         limit = parseInt(10);
//         offset = limit * (1 - 1);
//       }
//       if (q) {
//         var search = {};
//         search[Op.or] = {
//           title: { [Op.substring]: q.trim() },
//           description: { [Op.substring]: q.trim() },
//         };
//       }
//       const { count, rows: user } = await ShortclipModel.findAndCountAll({
//         offset,
//         limit,
//         attributes: [
//           "id",
//           "user_id",
//           "approve",
//           "disable",
//           "title",
//           "description",
//           "createdat",
//           "updatedat",
//           [
//             sequelize.literal(
//               "CONCAT('" +
//               process.env.VIDEOURL +
//               "shortClipVideos/" +
//               "',video)"
//             ),
//             "video",
//           ],
//         ],

//         // where: {
//         //   approve: "1",

//         //   ...search,
//         // },


//         where: {
//           ...search,
//           [Op.and]: [
//             { approve: "1" },
//             { disable: "1" },

//           ]
//         }
//       });

//       let next_page = false;
//       if (offset + limit < count) {
//         next_page = true;
//       }
//       if (!user) {
//         return apiResponse.ErrorResponse(res, "Something went wrong", user);
//       }
//       return apiResponse.successResponseWithData(
//         res,
//         "Successfully retrieve information of uploaded video",
//         { user, count, next_page }
//       );

//     } catch (err) {
//       console.log(err);
//       return apiResponse.ErrorResponse(res, err);
//     }
//   },
// ];