'use strict';

// Weather Example
// See https://wit.ai/sungkim/weather/stories and https://wit.ai/docs/quickstart
const Wit = require('node-wit').Wit;
const FB = require('./facebook.js');
const Config = require('./const.js');
const db = require('./db.js');

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  // say(sessionId, context, message, cb) {
  //     console.log(message);
  //
  //     // Bot testing mode, run cb() and return
  //     if (require.main === module) {
  //       cb();
  //       return;
  //     }
  //
  //     // Our bot has something to say!
  //     // Let's retrieve the Facebook user whose session belongs to from context
  //     // TODO: need to get Facebook user name
  //     const recipientId = context._fbid_;
  //     if (recipientId) {
  //       // Yay, we found our recipient!
  //       // Let's forward our bot response to her.
  //       FB.fbMessage(recipientId, message, (err, data) => {
  //         if (err) {
  //           console.log(
  //             'Oops! An error occurred while forwarding the response to',
  //             recipientId,
  //             ':',
  //             err
  //           );
  //         }
  //
  //         // Let's give the wheel back to our bot
  //         cb();
  //       });
  //     } else {
  //       console.log('Oops! Couldn\'t find user in context:', context);
  //       // Giving the wheel back to our bot
  //       cb();
  //     }
  // },
  // merge(sessionId, context, entities, message, cb) {
  //   // Retrieve the location entity and store it into a context field
  //   const loc = firstEntityValue(entities, 'location');
  //   if (loc) {
  //     context.loc = loc; // store it in context
  //   }
  //
  //   cb(context);
  // },
  // error(sessionId, context, error) {
  //   console.log(error.message);
  // },
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    console.log('sending...', JSON.stringify(response));
  },
  getForecast({context, entities}) {
    var location = firstEntityValue(entities, 'location');
    if (location) {
      context.forecast = 'sunny in ' + location; // we should call a weather API here
      delete context.missingLocation;
    } else {
      context.missingLocation = true;
      delete context.forecast;
    }
    return context;
  },
  saveName({context, entities}) {
    var name = firstEntityValue(entities, 'contact');
    console.log(context);
    console.log(entities);
    if (name) {
      context.name = name;
      console.log('Name: ' + name);
    } else {
      console.error('No name');
    }
    return context;
  },
  saveData({context, entities}) {
    var feelings = [];
    entities.feeling_intent.forEach(feeling => {
      feelings.push(feeling.value);
    });
    context.feelings = feelings;
    // console.log(context);
    // console.log(entities);
    db.getAuth(auth => {
      console.log("Write Data: ", [[context.name, context.feelings.join(',')]]);
      db.addRow(auth, [[context.name, context.feelings.join(',')]], result => {
        console.log('data written!');
      })
    });
    return context;
  }
};


const getWit = () => {
  return new Wit({
    accessToken: Config.WIT_TOKEN,
    actions: actions,
    apiVersion: '20160516'
  });
};

exports.getWit = getWit;

// bot testing mode
// http://stackoverflow.com/questions/6398196
if (require.main === module) {
  console.log("Bot testing mode.");
  const client = getWit();
  client.interactive();
}
