const Sequelize = require('sequelize');    
const sequelize = require('../config/db');    
    
const subscriptions= sequelize.define('subscriptions', {    
  id:{
    type:Sequelize.NUMBER,    
    allowNull:false,    
    primaryKey:true,    
    autoIncrement: true    
  },  
  title:{
    type:Sequelize.STRING,    
    allowNull:true   
  },
  duration:{
    type:Sequelize.STRING,    
    allowNull:true    
  }, 
  price:{
    type:Sequelize.STRING,    
    allowNull:true    
  }, 
  planDay:{
    type:Sequelize.STRING,    
    allowNull:true    
  }, 
  CreateDate:{
    type:Sequelize.DATE,    
    defaultValue : Date.now()
  }, 
  UpdateDate:{
    type:Sequelize.DATE,    
    defaultValue : Date.now()
  }, 
},{ timestamps: false});    
    
  module.exports =subscriptions ;  
