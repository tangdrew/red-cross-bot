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
      context.contact = firstEntityValue(entities, 'contact');
    } else if('feeling_intent' in entities) {
      let feelingIntent = entities.feeling_intent;
      var feelings = [];
      feelingIntent.forEach(feeling => {
        feelings.push(feeling.value);
      });
      context.feelings = feelings;
    } else if('number' in entities) {
      context.rating = firstEntityValue(entities, 'number');
    } else if('yes_no' in entities) {
      context.bool = firstEntityValue(entities, 'yes_no');
    }
    console.log('setting to ', context);

    cb(context);
  },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  saveData(sessionId, context, cb) {
    console.log('Final context: ', context);
    db.getAuth(auth => {
      console.log("Write Data: ", [[context.contact, context.feelings.join(','), context.rating, context.bool]]);
      db.addRow(auth, [[context.contact, context.feelings.join(','), context.rating, context.bool]], result => {
        console.log('data written!');
        context.done = true;
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
