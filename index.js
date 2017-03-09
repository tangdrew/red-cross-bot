'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express, request.
//
const bodyParser = require('body-parser');
const express = require('express');

// get Bot, const, and Facebook API
const bot = require('./bot.js');
const Config = require('./const.js');
const FB = require('./facebook.js');

// Setting up our bot
const wit = bot.getWit();

// Webserver parameter
const PORT = process.env.PORT || 8445;

// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {
      fbid: fbid,
      context: {
        _fbid_: fbid
      }
    }; // set context, _fid_
  }
  return sessionId;
};

// Starting our webserver and putting it all together
const app = express();
app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());
console.log("I'm wating for you @" + PORT);

// index. Let's say something fun
app.get('/', function(req, res) {
  res.send('"Only those who will risk going too far can possibly find out how far one can go." - T.S. Eliot');
});

// Webhook verify setup using FB_VERIFY_TOKEN
app.get('/webhook', (req, res) => {
  if (!Config.FB_VERIFY_TOKEN) {
    throw new Error('missing FB_VERIFY_TOKEN');
  }
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === Config.FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

// The main message handler
app.post('/webhook', (req, res) => {
  // Parsing the Messenger API response
  const messaging = FB.getFirstMessagingEntry(req.body);
  if (messaging && messaging.message) {

    // Yay! We got a new message!

    // We retrieve the Facebook user ID of the sender
    const sender = messaging.sender.id;

    // We retrieve the user's current session, or create one if it doesn't exist
    // This is needed for our bot to figure out the conversation history
    const sessionId = findOrCreateSession(sender);

    // We retrieve the message content
    const msg = messaging.message.text;
    const atts = messaging.message.attachments;

    if (atts) {
      // We received an attachment

      // Let's reply with an automatic message
      FB.fbMessage(
        sender,
        'Sorry I can only process text messages for now.'
      );
    } else if (msg) {
      // We received a text message

      // Let's forward the message to the Wit.ai Bot Engine
      // This will run all actions until our bot has nothing left to do
      wit.runActions(
        sessionId, // the user's current session
        msg, // the user's message
        sessions[sessionId].context, // the user's current session state
        (error, context) => {
          if (error) {
            console.log('Oops! Got an error from Wit:', error);
          } else {
            // Our bot did everything it has to do.
            // Now it's waiting for further messages to proceed.
            console.log('Waiting for futher messages.');

            // Based on the session state, you might want to reset the session.
            // This depends heavily on the business logic of your bot.
            // Example:
            // if (context['done']) {
            //   delete sessions[sessionId];
            // }

            // Updating the user's current session state
            sessions[sessionId].context = context;
          }
        }
      );
    }
  }
  res.sendStatus(200);
});
//
// 'use strict'
//
// const express = require('express')
// const bodyParser = require('body-parser')
// const request = require('request')
// const app = express()
//
//
// let Wit = null;
// let log = null;
// try {
//   // if running from repo
//   Wit = require('../').Wit;
//   log = require('../').log;
// } catch (e) {
//   Wit = require('node-wit').Wit;
//   log = require('node-wit').log;
// }
//
// const Config = require('./const.js');
// const token = process.env.FB_PAGE_ACCESS_TOKEN;
// const WIT_TOKEN = process.env.WIT_TOKEN;
//
// app.set('port', (process.env.PORT || 5000))
//
// // Process application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({extended: false}))
//
// // Process application/json
// app.use(bodyParser.json())
//
// // Index route
// app.get('/', function (req, res) {
//     res.send('Hello world, I am a chat bot')
// })
//
// // for Facebook verification
// app.get('/webhook/', function (req, res) {
//     if (req.query['hub.verify_token'] === 'verify_token') {
//         res.send(req.query['hub.challenge'])
//     }
//     res.send('Error, wrong token')
// })
//
// app.post('/webhook/', function (req, res) {
//     console.log('webhook');
//     // let messaging_events = req.body.entry[0].messaging
//     // for (let i = 0; i < messaging_events.length; i++) {
//     //     let event = req.body.entry[0].messaging[i]
//     //     let sender = event.sender.id
//     //     if (event.message && event.message.text) {
//     //         let text = event.message.text
//     //         sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
//     //     }
//     // }
//     // res.sendStatus(200)
//
//     const data = req.body;
//     console.log('webhook data');
//     console.log(data);
//
//   if (data.object === 'page') {
//     data.entry.forEach(entry => {
//       entry.messaging.forEach(event => {
//         if (event.message && !event.message.is_echo) {
//           // Yay! We got a new message!
//           // We retrieve the Facebook user ID of the sender
//           const sender = event.sender.id;
//
//           // We retrieve the user's current session, or create one if it doesn't exist
//           // This is needed for our bot to figure out the conversation history
//           const sessionId = findOrCreateSession(sender);
//
//           // We retrieve the message content
//           const {text, attachments} = event.message;
//
//           if (attachments) {
//             // We received an attachment
//             // Let's reply with an automatic message
//             fbMessage(sender, 'Sorry I can only process text messages for now.')
//             .catch(console.error);
//           } else if (text) {
//             // We received a text message
//
//             // Let's forward the message to the Wit.ai Bot Engine
//             // This will run all actions until our bot has nothing left to do
//             wit.runActions(
//               sessionId, // the user's current session
//               text, // the user's message
//               sessions[sessionId].context // the user's current session state
//             ).then((context) => {
//               // Our bot did everything it has to do.
//               // Now it's waiting for further messages to proceed.
//               console.log('Waiting for next user messages');
//
//               // Based on the session state, you might want to reset the session.
//               // This depends heavily on the business logic of your bot.
//               // Example:
//               // if (context['done']) {
//               //   delete sessions[sessionId];
//               // }
//
//               // Updating the user's current session state
//               sessions[sessionId].context = context;
//             })
//             .catch((err) => {
//               console.error('Oops! Got an error from Wit: ', err.stack || err);
//             })
//           }
//         } else {
//           console.log('received event', JSON.stringify(event));
//         }
//       });
//     });
//   }
//   res.sendStatus(200);
// })
//
// function sendTextMessage(sender, text) {
//     let messageData = { text:text }
//     request({
//         url: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: {access_token:token},
//         method: 'POST',
//         json: {
//             recipient: {id:sender},
//             message: messageData,
//         }
//     }, function(error, response, body) {
//         if (error) {
//             console.log('Error sending messages: ', error)
//         } else if (response.body.error) {
//             console.log('Error: ', response.body.error)
//         }
//     })
// }
//
// // ----------------------------------------------------------------------------
// // Messenger API specific code
//
// // See the Send API reference
// // https://developers.facebook.com/docs/messenger-platform/send-api-reference
//
// const fbMessage = (id, text) => {
//   const body = JSON.stringify({
//     recipient: { id },
//     message: { text },
//   });
//   const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
//   return fetch('https://graph.facebook.com/me/messages?' + qs, {
//     method: 'POST',
//     headers: {'Content-Type': 'application/json'},
//     body,
//   })
//   .then(rsp => rsp.json())
//   .then(json => {
//     if (json.error && json.error.message) {
//       throw new Error(json.error.message);
//     }
//     return json;
//   });
// };
//
// // ----------------------------------------------------------------------------
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
//     sessions[sessionId] = {fbid: fbid, context: {}};
//   }
//   return sessionId;
// };
//
// // // Our bot actions
// // const actions = {
// //   send({sessionId}, {text}) {
// //     // Our bot has something to say!
// //     // Let's retrieve the Facebook user whose session belongs to
// //     const recipientId = sessions[sessionId].fbid;
// //     if (recipientId) {
// //       // Yay, we found our recipient!
// //       // Let's forward our bot response to her.
// //       // We return a promise to let our bot know when we're done sending
// //       return fbMessage(recipientId, text)
// //       .then(() => null)
// //       .catch((err) => {
// //         console.error(
// //           'Oops! An error occurred while forwarding the response to',
// //           recipientId,
// //           ':',
// //           err.stack || err
// //         );
// //       });
// //     } else {
// //       console.error('Oops! Couldn\'t find user for session:', sessionId);
// //       // Giving the wheel back to our bot
// //       return Promise.resolve()
// //     }
// //   },
// //   // You should implement your custom actions here
// //   // See https://wit.ai/docs/quickstart
// // };
// const actions = {
//   say(sessionId, context, message, cb) {
//       console.log(message);
//
//       // Bot testing mode, run cb() and return
//       if (require.main === module) {
//         cb();
//         return;
//       }
//
//       // Our bot has something to say!
//       // Let's retrieve the Facebook user whose session belongs to from context
//       // TODO: need to get Facebook user name
//       const recipientId = context._fbid_;
//       if (recipientId) {
//         // Yay, we found our recipient!
//         // Let's forward our bot response to her.
//         FB.fbMessage(recipientId, message, (err, data) => {
//           if (err) {
//             console.log(
//               'Oops! An error occurred while forwarding the response to',
//               recipientId,
//               ':',
//               err
//             );
//           }
//
//           // Let's give the wheel back to our bot
//           cb();
//         });
//       } else {
//         console.log('Oops! Couldn\'t find user in context:', context);
//         // Giving the wheel back to our bot
//         cb();
//       }
//   },
//   merge(sessionId, context, entities, message, cb) {
//     // Retrieve the location entity and store it into a context field
//     const loc = firstEntityValue(entities, 'location');
//     if (loc) {
//       context.loc = loc; // store it in context
//     }
//
//     cb(context);
//   },
//   error(sessionId, context, error) {
//     console.log(error.message);
//   }
// }
//
// // Setting up our bot
// const wit = new Wit({
//   accessToken: WIT_TOKEN,
//   actions: actions,
//   apiVersion: '20160516'
// });
//
// // Spin up the server
// app.listen(app.get('port'), function() {
//     console.log('running on port', app.get('port'))
// })
