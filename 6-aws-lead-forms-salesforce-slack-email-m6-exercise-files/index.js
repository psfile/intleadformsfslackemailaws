'use strict';

const https = require('https');
const AWS = require('aws-sdk');

const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
const QUEUE_URL = process.env.queue_url;

const requests = [
        {
            "name": "sfdc",
            "options": {
                  hostname: process.env.gateway_url,
                  port: 443,
                  path: '/dev/sfdc-lead',
                  method: 'POST'
                }
        },
        {
            "name": "email",
            "options": {
                  hostname: process.env.gateway_url,
                  port: 443,
                  path: '/dev/send-email',
                  method: 'POST'
                }
        },
        {
            "name": "slack",
            "options": {
                  hostname: process.env.gateway_url,
                  port: 443,
                  path: '/dev/slack-support',
                  method: 'POST'
                }
        }
    ];

function sendSlack(event,cb1) {
    var request = requests[2];

    if (event.phone){
        const req = https.request(request.options, (res) => {
            let body = '';

            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
        
            res.on('end', () => {
                cb1(true)
            });
        
        });
        req.on('error', cb1);
        //adjust post content for slack message
        var combined = event.phone + " " + event.first_name + " " + event.last_name;
        var slackMsg = {
            "text": combined
        };
        req.write(JSON.stringify(slackMsg));
        req.end();
        
    } else {
        cb1(true);
    }
}
    
function sendEmail(event,cb2) {
    var request = requests[1];

    if (event.email) {
        const req = https.request(request.options, (res) => {
            let body = '';

            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
        
            res.on('end', () => {
                cb2(true)
            });
        
        });
        req.on('error', cb2);
        req.write(JSON.stringify(event));
        req.end();
        
    } else {
        cb2(true);
    }
}

function sendSFDC(event,cb3) {
    var request = requests[0];

    const req = https.request(request.options, (res) => {
        let body = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
    
        res.on('end', () => {
            cb3(true);
        });
    
    }).on('error', function(e) {
            cb3(false);
    });
    //req.on('error', cb3);
    req.write(JSON.stringify(event));
    req.end();
    
}

function loadMessage(cb4){
    const params = {
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        VisibilityTimeout: 10,
    };
    SQS.receiveMessage(params, (err, data) => {
        if (err) {
            return cb4(false, err);
        } else {
            if (data.Messages) {
                // Get the first message (should be the only one since we said to only get one above)
                var message = data.Messages[0];
                var body = message.Body;

                cb4(true, JSON.parse(body), message.ReceiptHandle);
            } else {
                cb4(false, 'No Message.');
            }
            
        }
    });
}

function removeMessage(handle, cb5){
    SQS.deleteMessage({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: handle
   }, function(err, data) {
      console.log(err);
   });
   cb5();
}

/**
 * Main handle for lambda
 */
exports.handler = (event, context, callback) => {
    
    loadMessage(function (result, payload, handle) {
        if (result){

            sendSFDC(payload, function(result1){

                sendSlack(payload, function(result2){

                    sendEmail(payload, function(result3){

                        removeMessage(handle, function(){
                            callback(null, {messages: "sent message."});
                        });
                    });
                }); //call the next url to fetch    
            });
        } else {
            console.log(payload);
        }
    });
    
    
};
