const FCM = require('fcm-node');
const server_key = 'AAAAdruK7_Y:APA91bHSdh9bmxmQGS6ZpeRJLoR_UYcGb8w3fuLbCm26RYqpW1yhACdcl8YS_M8AfZye0LipWeQcUGgMNLyw-fkIPLDM1lShMsAcV8UFWAvO7LCa_IQU6bhMqKv6q3A9tIOzRbpKrYP0';
const fcm = new FCM(server_key);
const apiResponse = require('../../helpers/apiResponse');
const auth = require('../../middlewares/jwt');

exports.sendMessage = [
    auth,
    async (req,res) => {
        try {
            const registerToken = req.body.registerToken;
            const title = req.body.title;
            if(registerToken){
                const message = {
                    to : registerToken,
                    notification : {
                        title : title
                    },
                    data : {
                        my_key : 'high',
                        my_value : 'my value' 
                    } 
                };
                fcm.send(message, function(err, response){
                    if (err) {
                        console.log("Something has gone wrong!");
                    } else {
                        console.log("Successfully sent with response: ", response);
                    }
                });
            }
            else{
                return apiResponse.ErrorResponse(
                    res,
                    "registerToken is require",
                )
            }
        } catch (error) {
            console.log(error);
            res.json(error);
        }
    }
]