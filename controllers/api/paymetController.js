const { body, validationResult, check } = require("express-validator");
const subscriptionsModel = require('../../models/subscription');
const apiResponse = require("../../helpers/apiResponse");
const sequelize = require('../../config/db')
const paymentModel = require('../../models/SubPaymentModel');
const UserModel = require('../../models/user');
const auth = require("../../middlewares/jwt");
const { Op } = require("sequelize");
const { token } = require("morgan");
require("dotenv").config();
const moment = require('moment');
const Publishable_key = 'sk_test_51JNCruJlyaU3sS1mEKlcT8hoYbasP8AWGmxjo2nKUNEZ1mz5HyqrDo4B1jYhsfbS3j6zJzq7SGR2Mb6uQzWkK1gs00pm206cKn';
const Secret_key = 'sk_test_51JNCruJlyaU3sS1mEKlcT8hoYbasP8AWGmxjo2nKUNEZ1mz5HyqrDo4B1jYhsfbS3j6zJzq7SGR2Mb6uQzWkK1gs00pm206cKn';
const stripe = require('stripe')(Secret_key);


exports.create_Payment = [
  auth,
  check("amount")
    .trim()
    .notEmpty()
    .withMessage("amount  is Required")
    .isInt(),
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
      const amount = req.body.amount;
      if (amount) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100,
          currency: "usd",
          automatic_payment_methods: {
            enabled: true,
          },
        });
        console.log(paymentIntent.client_secret);
        const clientSecret = paymentIntent.client_secret;
        return apiResponse.successResponseWithData(
          res,
          "payment Intent",
          clientSecret
        );
      }
      else {
        return apiResponse.ErrorResponse(
          res,
          "Amount is require",
        )
    }
  } catch (error) {
    console.log(error);
    res.json(error);
  }
  },
];


exports.payment_sheet = [
  auth,
  check("subId")
    .trim()
    .notEmpty()
    .withMessage("subId  is Required")
    .isInt(),
  async (req, res) => {
    try {
      // Use an existing Customer ID if this is a returning customer.
      const amount = req.body.amount
      const customer = await stripe.customers.create();
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2020-08-27' }
      );
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount) * 100,
        currency: 'usd',
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: Publishable_key
      });
    } catch (error) {
      console.log(error);
      res.json(error);
    }
  }
]



exports.Success_payment = [
  auth,
  check("subId")
    .trim()
    .notEmpty()
    .withMessage("subId is Required")
    .isInt(),
  check("payment_intent")
    .trim()
    .notEmpty()
    .withMessage("payment_intent is Required"),
  check("client_secret")
    .trim()
    .notEmpty()
    .withMessage("client_secret is Required"),
  check("redirect_status")
    .trim()
    .notEmpty()
    .withMessage("redirect_status is Required"),
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
      const userId = req.user.id;
      if (userId) {
        const subId = req.body.subId;
        const { payment_intent, client_secret, redirect_status } = req.body;
        const data = { payment_intent, client_secret, redirect_status, subId, userId, }
        const getSub = await subscriptionsModel.findOne({ where: { id: subId } });
        if (getSub) {
          const days = getSub.dataValues.planDay;
          data.expireDate = moment().add(days, 'days').format('YYYY-MM-DD');
          data.planTitel = getSub.dataValues.title;
          data.price = getSub.dataValues.price;
          const getPaln = await paymentModel.create(data);
          if (getPaln) {
            return apiResponse.successResponseWithData(
              res,
              "payment Success",
              getPaln
            );
          }
        }
      }
      else {
        return apiResponse.ErrorResponse(
          res,
          "SubScription Id is require",
        )
      }
    } catch (error) {
      console.log(error);
      res.json(error);
    }
  }
]



exports.check_Sub = [
  auth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      console.log('userid'.userId)
      const todayDate = moment().format('YYYY-MM-DD');
      const userData = await UserModel.findOne({
        attributes: [
          'id', 'user_type',
          [sequelize.fn('date_format', sequelize.col('createdAt'), '%Y-%m-%d'), 'createdAt']
        ],
        where: {
          id: userId
        }
      });
      console.log('userData',userData)
      const createdAt = userData.dataValues.createdAt
      let createDiff = moment(createdAt);
      let toDayDate = moment(todayDate);
      const Diffr = toDayDate.diff(createDiff, 'days');
      console.log('Diffr', Diffr)
      if (Diffr > -1 && Diffr < 7 && userData.user_type == 'user') {
        return apiResponse.successResponseWithData(
          res,
          "Active live stream",
        );
      }
      else if (Diffr > -1 && Diffr < 21 && userData.user_type == "player" || userData.user_type == "coach") {
        return apiResponse.successResponseWithData(
          res,
          "Active live stream",
        );
      }
      else {
        const userBuyData = await paymentModel.findOne({
          where: {
            userId: userId
          }
        });
        if (userBuyData) {
          const exp = userBuyData.dataValues.expireDate
          let expireDate = moment(exp);
          let currentDate = moment(todayDate);
          const Datediff = expireDate.diff(currentDate, 'days');
          if (userBuyData && userBuyData.dataValues.expireDate <= Datediff) {
            return apiResponse.successResponseWithData(
              res,
              "Active live stream",
              userBuyData
            );
          }
        }
        else {
          return apiResponse.notFoundResponse(
            res,
            "Buy Subscription for watch live stream"
          )
        }
      }
    } catch (error) {
      console.log(error);
      res.json(error);
    }
  }
]