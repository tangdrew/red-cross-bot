'use strict';

// Weather Example
// See https://wit.ai/sungkim/weather/stories and https://wit.ai/docs/quickstart
const Wit = require('node-wit').Wit;
const FB = require('./facebook.js');
const Config = require('./const.js');
const db = require('./db.js');

const token = process.env.FB_PAGE_ACCESS_TOKEN;
const WIT_TOKEN = process.env.WIT_TOKEN;

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
  say(sessionId, context, message, cb) {
      console.log(message);

      // Bot testing mode, run cb() and return
      if (require.main === module) {
        cb();
        return;
      }

      // Our bot has something to say!
      // Let's retrieve the Facebook user whose session belongs to from context
      // TODO: need to get Facebook user name
      const recipientId = context._fbid_;
      if (recipientId) {
        // Yay, we found our recipient!
        // Let's forward our bot response to her.
        FB.fbMessage(recipientId, message, (err, data) => {
          if (err) {
            console.log(
              'Oops! An error occurred while forwarding the response to',
              recipientId,
              ':',
              err
            );
          }

          // Let's give the wheel back to our bot
          cb();
        });
      } else {
        console.log('Oops! Couldn\'t find user in context:', context);
        // Giving the wheel back to our bot
        cb();
      }
  },
  merge(sessionId, context, entities, message, cb) {
    // Retrieve the location entity and store it into a context field
    console.log(entities);
    let loc = '';
    if('contact' in entities) {
      loc = firstEntityValue(entities, 'contact');
    } else if('feeling_intent' in entities) {
      loc = entities.feeling_intent;
    }
    if (loc) {
      console.log('setting loc to ', loc);
      context.loc = loc; // store it in context
    }

    cb(context);
  },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  saveName(sessionId, context, cb) {
    let name = context.loc;
    if (name) {
      context.name = name;
      console.log('Name: ' + name);
    } else {
      console.error('No name');
    }
    cb(context);
  },
  saveData(sessionId, context, cb) {
    let feelingIntent = context.loc;
    var feelings = [];
    feelingIntent.forEach(feeling => {
      feelings.push(feeling.value);
    });
    context.feelings = feelings;
    db.getAuth(auth => {
      console.log("Write Data: ", [[context.name, context.feelings.join(',')]]);
      db.addRow(auth, [[context.name, context.feelings.join(',')]], result => {
        console.log('data written!');
        cb(context);
      })
    });
  }
};

const getWit = () => {
  return new Wit(Config.WIT_TOKEN, actions);
};

exports.getWit = getWit;

// bot testing mode
// http://stackoverflow.com/questions/6398196
if (require.main === module) {
  console.log("Bot testing mode.");
  const client = getWit();
  client.interactive();
}
