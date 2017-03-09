// 'use strict';
//
// // Messenger API integration example
// // We assume you have:
// // * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// // * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// // You need to `npm install` the following dependencies: body-parser, express, request.
// //
// const bodyParser = require('body-parser');
// const express = require('express');
//
// // get Bot, const, and Facebook API
// const bot = require('./bot.js');
// const Config = require('./const.js');
// const FB = require('./facebook.js');
//
// // Setting up our bot
// const wit = bot.getWit();
//
// // Webserver parameter
// const PORT = process.env.PORT || 8445;
//
// // Wit.ai bot specific code
//
// // This will contain all user sessions.
// // Each session has an entry:
// // sessionId -> {fbid: facebookUserId, context: sessionState}
// const sessions = {};
//
// const findOrCreateSession = (fbid) => {
//   let sessionId;
//   // Let's see if we already have a session for the user fbid
//   Object.keys(sessions).forEach(k => {
//     if (sessions[k].fbid === fbid) {
//       // Yep, got it!
//       sessionId = k;
//     }
//   });
//   if (!sessionId) {
//     // No session found for user fbid, let's create a new one
//     sessionId = new Date().toISOString();
//     sessions[sessionId] = {
//       fbid: fbid,
//       context: {
//         _fbid_: fbid
//       }
//     }; // set context, _fid_
//   }
//   return sessionId;
// };
//
// // Starting our webserver and putting it all together
// const app = express();
// app.set('port', PORT);
// app.listen(app.get('port'));
// app.use(bodyParser.json());
// console.log("I'm wating for you @" + PORT);
//
// // index. Let's say something fun
// app.get('/', function(req, res) {
//   res.send('"Only those who will risk going too far can possibly find out how far one can go." - T.S. Eliot');
// });
//
// // Webhook verify setup using FB_VERIFY_TOKEN
// app.get('/webhook', (req, res) => {
//   if (!Config.FB_VERIFY_TOKEN) {
//     throw new Error('missing FB_VERIFY_TOKEN');
//   }
//   if (req.query['hub.mode'] === 'subscribe' &&
//     req.query['hub.verify_token'] === Config.FB_VERIFY_TOKEN) {
//     res.send(req.query['hub.challenge']);
//   } else {
//     res.sendStatus(400);
//   }
// });
//
// // The main message handler
// app.post('/webhook', (req, res) => {
//   // Parsing the Messenger API response
//   const messaging = FB.getFirstMessagingEntry(req.body);
//   if (messaging && messaging.message) {
//
//     // Yay! We got a new message!
//
//     // We retrieve the Facebook user ID of the sender
//     const sender = messaging.sender.id;
//
//     // We retrieve the user's current session, or create one if it doesn't exist
//     // This is needed for our bot to figure out the conversation history
//     const sessionId = findOrCreateSession(sender);
//
//     // We retrieve the message content
//     const msg = messaging.message.text;
//     const atts = messaging.message.attachments;
//
//     if (atts) {
//       // We received an attachment
//
//       // Let's reply with an automatic message
//       FB.fbMessage(
//         sender,
//         'Sorry I can only process text messages for now.'
//       );
//     } else if (msg) {
//       // We received a text message
//
//       // Let's forward the message to the Wit.ai Bot Engine
//       // This will run all actions until our bot has nothing left to do
//       wit.runActions(
//         sessionId, // the user's current session
//         msg, // the user's message
//         sessions[sessionId].context, // the user's current session state
//         (error, context) => {
//           if (error) {
//             console.log('Oops! Got an error from Wit:', error);
//           } else {
//             // Our bot did everything it has to do.
//             // Now it's waiting for further messages to proceed.
//             console.log('Waiting for futher messages.');
//
//             // Based on the session state, you might want to reset the session.
//             // This depends heavily on the business logic of your bot.
//             // Example:
//             // if (context['done']) {
//             //   delete sessions[sessionId];
//             // }
//
//             // Updating the user's current session state
//             sessions[sessionId].context = context;
//           }
//         }
//       );
//     }
//   }
//   res.sendStatus(200);
// });

'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const Config = require('./const.js');
const token = process.env.FB_PAGE_ACCESS_TOKEN;

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'verify_token') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
    console.log('webhook');
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
