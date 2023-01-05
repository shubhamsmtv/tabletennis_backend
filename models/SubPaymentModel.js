const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('userBuySubscription', {
    id: {
        type: Sequelize.NUMBER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    payment_intent: {
        type: Sequelize.STRING,
        allowNull: false
    },
    client_secret: {
        type: Sequelize.STRING,
        allowNull: false
    },
    redirect_status: {
        type: Sequelize.STRING,
        allowNull: false
    },
    subId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    userId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    planTitel: {
        type: Sequelize.STRING,
        allowNull: false
    },
    price: {
        type: Sequelize.NUMBER,
        allowNull: false
    },
    createDate: {
        type: Sequelize.DATE,
        defaultValue : new Date()
    },
    expireDate: {
        type: Sequelize.DATE,
        allowNull: false
    },
},{tableName : 'userBuySubscription',timestamps: false});

module.exports = Payment;