const ArticleModel = require("../../models/article");
const apiResponse = require("../../helpers/apiResponse");
const auth = require("../../middlewares/jwt");
const { body, validationResult } = require("express-validator");
const sequelize = require("../../config/db");
const { Op } = require("sequelize");
var path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const article = require("../../models/article");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let path = `./public/articleVideo/`;
    fs.mkdirsSync(path);
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(
      null,
       uuidv4() + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

var fileUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
  fileFilter: fileFilter,
});

//Add Articles by Admin
exports.add = [
  auth,

  fileUpload.single('image'),
  body("title")
    .trim()
    .isLength({ min: 1 })  
    .withMessage("Title  is required"),
  body("content")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Content  is required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(res, errors.array({ onlyFirstError: false })[0].msg);
      }      
      if (!req.file) {
        let info = {
          title: req.body.title,
          content: req.body.content,
          image: 'default.png'
        }
        const articlefile = await ArticleModel.create(info)

        info.image = articlefile.image ? process.env.IMAGEURL + 'articleVideo/' + articlefile.image : process.env.IMAGEURL + 'public/uploads/default.png';
        return apiResponse.successResponseWithData(res, "Article Added  Sucessfully", info);
      } else {
        let info = {
          title: req.body.title,
          content: req.body.content,
          image: req.file.filename
        }
        const articlefile = await ArticleModel.create(info)
        info.image = articlefile.image ? process.env.IMAGEURL + 'articleVideo/' + articlefile.image : process.env.IMAGEURL + 'public/uploads/default.png';
        return apiResponse.successResponseWithData(res, "Article Added  Sucessfully", info);
      }
    }
    catch (err) {
      const errorInfo = {
        title: req.body,
        file: req.file
      }
      return apiResponse.ErrorResponse(res, errorInfo);
    }
  }];

//Article List by admin
exports.list = [
  async (req, res) => {
    try {
        const {  pageNumber , pageSize,q } = req.body;

        if(pageNumber && pageSize){
            limit = parseInt(pageSize);
            offset = limit * (pageNumber - 1);
        }else{
            limit = parseInt(10);
            offset = limit * (1 - 1);
        }
        if(q){
          var search={};
           search[Op.or]={
               title : {[Op.substring]: q.trim()},
              //  content : {[Op.substring]: q.trim()},
           }
          }
       const {count,rows:user}  = await ArticleModel.findAndCountAll({
        offset,limit,
        order: [
            ['id', 'DESC'],
        ],
         
           attributes: ['id', 'title','content', 'createdat', 'updatedat',
           [sequelize.literal("CONCAT('" + process.env.IMAGEURL+ 'articleVideo/' + "',image)"), 'image']
       ],
          where: { 
  
            ...search
          }  
         });

         let next_page=false
         if((offset+limit)<count){
             next_page=true;
             
         }

         if(!user){
            return apiResponse.ErrorResponse(res, 'Something went wrong',user);
         }
    return apiResponse.successResponseWithData(res, "Successfully retrieve information of uploaded video",{user,count,next_page});  
    
 } catch (err) {
        console.log(err)
        return apiResponse.ErrorResponse(res, err);
    }
}];



exports.list_history = [
  auth,
  async (req, res) => {
    try {
      const user = await ArticleModel.findOne({
        // attributes: { exclude: ["password", "confirmpassword"] },
        attributes: [
          "id",
          "content",
          "title",
          "createdat",
          "updatedat",
          [
            sequelize.literal(
              "IF(image!='',CONCAT('" +
                process.env.IMAGEURL +
                "articleVideo/" +
                "',image),'" +
                process.env.IMAGEURL +
                "public/uploads/default.png')"
            ),
            "image",
          ],
        ],

        where: { id: req.body.id },
      });
      console.log(user)
      if (user) {
        return apiResponse.successResponseWithData(
          res,
          "Successfully retrieve information of Article",
          user
        );
      }
      else{
        return apiResponse.ErrorResponse(res, "Something went wrong", user);
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

//Update Articles by Admin

exports.update = [
  auth,
  fileUpload.single('image'),
  body("id").isLength({ min: 1 }).trim().withMessage("id is required"),
  body("title").isLength({ min: 1 }).trim().withMessage("title  is required"),
  body("content").isLength({ min: 1 }).trim().withMessage("content  is required"),
  async (req, res) => {
    var body = req.body;
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationErrorWithData(res, errors.array({ onlyFirstError: false })[0].msg);
    }
    if(req.file) {
      var set_data = {
        title: body.title,
        content: body.content,
        image: req.file.filename
      }
      set_data.image =  set_data.image
    }else {
      var set_data = {
        title: body.title,
        content: body.content
      } 
    }
    try {
      await ArticleModel.update(set_data, { where: { id: req.body.id } });
      var user = await ArticleModel.findOne({
        attributes: [
          "id",
          "content",
          "title",
          "createdat",
          "updatedat",
          [
            sequelize.literal(
              "IF(image!='',CONCAT('" +
                process.env.IMAGEURL +
                "articleVideo/" +
                "',image),'" +
                process.env.IMAGEURL +
                "public/uploads/default.png')"
            ),
            "image",
          ],
        ],
        where: { id: req.body.id }
      });
      console.log('user',user.image)
      if (!user) {
        return apiResponse.ErrorResponse(res, "No information  found by this user", user);
      }
      return apiResponse.successResponseWithData(res, "information updated sucessfully", user);

    } catch (err) {
      console.log(err)
      return apiResponse.ErrorResponse(res, err);
    }
  }];

//Article Delete by Admin
exports.delete = [
  auth,
  body("id")
    .trim()
    .isLength({ min: 1 })
    .withMessage("id is required"),
  async (req, res) => {
    try {
      //  const articleImage = await ArticleModel.findOne({attributes:['image'],where:{id:req.body.id}});
      const articleList = await ArticleModel.destroy({
        where: { id: req.body.id },
      });
      if (!articleList) {
        return apiResponse.successResponseWithData(
          res,
          "No Article Found",
          articleList
        );
      }
      return apiResponse.successResponseWithData(
        res,
        "Article deleted sucessfully",
        articleList
      );
    } catch (err) {
      console.log(err)
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
