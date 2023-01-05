const Sequelize = require('sequelize');    
const sequelize = require('../config/db');  
const users = require("./user");   
    
// const shortclip = sequelize.define('shortclips', {  
//     id:{
//         type:Sequelize.NUMBER,    
//         allowNull:false,    
//         primaryKey:true,    
//         autoIncrement: true    
//     },   
//     user_id:{
//         type:Sequelize.NUMBER, 
//         allowNull:true,   
//     },  

//     title:{
//         type:Sequelize.STRING, 
//         allowNull:true,   
//     }, 
//     description:{
//         type:Sequelize.STRING, 
//         allowNull:true,   

//     },

//     video:{
//         type: Sequelize.STRING,
//         allowNull: true
//     },   
    
//     approve:Sequelize.ENUM(['1','0']),
//     disable:Sequelize.ENUM(['1','0']),

// },{timestamps: true});

// shortclip.hasOne(users, {
//     foreignKey: {
//         name: 'id',
//         allowNull: false,
//     },
//     sourceKey : 'user_id',
//     // as : 'images'
// });    



const shortclip = sequelize.define('short_clip_video',{
    title : {
        type : Sequelize.STRING,
        allowNull : false
    },
    video : {
        type : Sequelize.STRING,
        allowNull : false
    },
    description : {
        type : Sequelize.STRING,
        allowNull : false
    },
    createDate : {
        type : Sequelize.DATE,
        defaultValue : Date.now()
    },
    updateDate : {
        type : Sequelize.DATE,
        defaultValue : Date.now()
    },
},{tableName : "short_clip_video",timestamps: false});


    
module.exports =shortclip;    
