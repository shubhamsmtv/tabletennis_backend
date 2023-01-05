const Sequelize = require('sequelize');    
const sequelize = require('../config/db'); 
  
    
const Activity = sequelize.define('Activitys', {  
    id:{
        type:Sequelize.NUMBER,    
        allowNull:false,    
        primaryKey:true,    
        autoIncrement: true    
    },   
    user_id:{
        type:Sequelize.NUMBER, 
        allowNull:false,   
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    user_type: {
        type: Sequelize.STRING,
        allowNull: false
    }, 
    video_type: {
        type: Sequelize.STRING,
        allowNull: false
    }, 
    description: {
        type: Sequelize.STRING,
        allowNull: false
    },
    video:{
        type: Sequelize.STRING,
        allowNull: false
    }, 
    path:{
        type: Sequelize.STRING,
        allowNull: false
    },     
},{ 
    timestamps: true,
 
 });    
    
  module.exports =Activity;    
