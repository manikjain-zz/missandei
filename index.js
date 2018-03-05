'use strict';

const redis = require('redis');
const Bot = require('./bot.js');
const data = require('./bot.json');
const Handover = require('./plugins').Handover;
const OpsCalendar = require('./plugins').OpsCalendar;
const https = require('https');
const request = require('superagent');
const moment = require('moment');
const fs = require('fs');
const PD = require('./schedules');

const client = redis.createClient();
const bot = new Bot({token: data.BOT.key});
const handover = new Handover(client, bot);
const opscalendar = new OpsCalendar();
const schedule_ids = [PD.SCHEDULES.HOTSEAT, PD.SCHEDULES.HOTSEAT_SEC, PD.SCHEDULES.OPS_MGT, PD.SCHEDULES.OPS_DBA_1,
PD.SCHEDULES.OPS_DBA_2, PD.SCHEDULES.ONCALL_PRIMARY, PD.SCHEDULES.ONCALL_SEC, PD.SCHEDULES.OPS_VCL];
const escalation_policy_ids = [PD.ESC_POLICY.OPS_DEFAULT, PD.ESC_POLICY.ROTATION_VCL, PD.ESC_POLICY.DBA];

function getArgs(msg) {
  return msg.split(' ').slice(1);
}

function sendRandom(message, webhook){
  request
  .post(webhook)
  .send({
    text: message
  })
  .end((err, res) => { if (err)
    console.log(err);
  });
}

function sort_oncalls(a,b) {
  return (moment(a.start).diff(moment(b.start)) > 0) ? 1: ((moment(a.start).diff(moment(b.start)) < 0) ? -1: 0);
}

bot.respondTo('(hello|hi|good morning|gm|good evening|good afternoon|gday|morning) (ops|team|folks|chaps|opsians|people)', (message, channel, user) => {
  if ( !user.profile.first_name ) {
    var first_name = user.profile.real_name;
  } else {
    var first_name = user.profile.first_name;
  }
  var messages = [`Hello to you too, ${first_name}!`,
  `Howdy howdy howdy, ${first_name}!`,
  `Whaddup.`,
  `Ahoy matey!`,
  `Ello Mate!`,
  `Yo-yo yiggidy-yo!`,
  `Look what the cat dragged in!`,
  `Oh, there you are!`,
  `What's going on ${first_name}?`,
  `Rise n’ shine, ${first_name}!`];
  bot.send(messages[Math.floor(Math.random() * messages.length)], channel);
}, true);

bot.respondTo('(goodbye|bbye|bye|see ya|see ya later|later|cya|seeya|cheerio) (chaps|folks|team|ops|opsians|people)', (message, channel, user) => {
  if ( !user.profile.first_name ) {
    var first_name = user.profile.real_name;
  } else {
    var first_name = user.profile.first_name;
  }
  var messages = [`Catch ya on the flipside, ${first_name}!`,
  `Later gater.`,
  `Catcha lataaaa.`,
  `Bye, boomerang!`,
  `Take it easy, ${first_name}.`,
  `Catch ya later, ${first_name}.`,
  `Have a good one, ${first_name}.`,
  `Oh wait, we need your help! :wink:`,
  `See you later, ${first_name}.`,
  `Take care ${first_name}.`,
  `Stay classy, sassy, and a bit bad assy.`,
  `Is your name Winter? Because you'll be coming soon.`];
  bot.send(messages[Math.floor(Math.random() * messages.length)], channel);
}, true);

client.on('error', (err) => {
  console.log('Error ' + err);
});

client.on('connect', () => {
console.log('Connected to Redis!');
});

client.hgetall('OnAlerts', (err, reply) => {
  if (err) {
    console.log(err);
    return;
  } else {
//    console.log(reply);
    if (reply === null) {
      client.hmset('OnAlerts', {username: 'none', realname: 'None'}, (err) => {
        if (err) {
        console.log(err);
      } else {
          console.log('Set default value for OnAlerts');
      }
      });
    }
  }
});


bot.respondTo('alerts', (message, channel, user) => {
  let args = getArgs(message.text);
  if (!user.is_bot){
    switch(args[0]) {
      case 'take':
        client.hgetall('OnAlerts', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s on alerts but failed. :(', channel);
            return;
          }
          bot.send(`${reply.realname} <@${reply.username}> was on alerts, now ${user.profile.real_name} <@${user.id}> is on alerts.`, channel);
        });
        client.hmset('OnAlerts', {username: user.id, realname: user.profile.real_name}, (err) => {
          if (err) {
            bot.send('Error: Oops! I tried to put you on alerts but failed. :(', channel);
          }
        });
        break;

      case 'taketh':
        client.hgetall('OnAlerts', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s on alerts but failed. :(', channel);
            return;
          }
          bot.send(`Forsooth! ${reply.realname} <@${reply.username}> was the alertee, but ${user.profile.real_name} <@${user.id}> taketh alerts henceforth!  May thy crits be not..`, channel);
        });
        client.hmset('OnAlerts', {username: user.id, realname: user.profile.real_name}, (err) => {
          if (err) {
            bot.send('Error: Oops! I tried to put you on alerts but failed. :(', channel);
          }
        });
        break;

      // Just for fun :D
      case 'takewhatismine':
        client.hgetall('OnAlerts', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s on alerts but failed. :(', channel);
            return;
          }
          bot.send(`${reply.realname} <@${reply.username}>, you stand in the presence of ${user.profile.real_name} <@${user.id}> of the House PagerDuty, rightful heir to the hotseat, the Unburnt, Protector of the Realm, Breaker of alerts. Bend thy knee!`, channel);
        });
        client.hmset('OnAlerts', {username: user.id, realname: user.profile.real_name}, (err) => {
          if (err) {
            bot.send('Error: Oops! I tried to put you on alerts but failed. :(', channel);
          }
        });
        break;

      case 'takeadeepbreath':
        client.hgetall('OnAlerts', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s on alerts but failed. :(', channel);
            return;
          }
        bot.send(`${reply.realname} <@${reply.username}>, take a deep breath and let out all the stress, because ${user.profile.real_name} <@${user.id}> takes it from here! :relaxed:`, channel);
        });
        client.hmset('OnAlerts', {username: user.id, realname: user.profile.real_name}, (err) => {
          if (err) {
            bot.send('Error: Oops! I tried to put you on alerts but failed. :(', channel);
          }
        });
        break;

      case 'who':
      case 'whom':
      case '0':
      case '1':
        client.hgetall('OnAlerts', (err, reply) => {
          if (err) {
            console.log(err);
            bot.send('Oops! I tried to find who\'s on alerts but failed. :(', channel);
            return;
          }
          bot.send(`${reply.realname} <@${reply.username}> is on alerts.`, channel);
        });

        break;

      case 'help':
        bot.send('Usage: \`alerts [who|whom|0|1]\` - Find who is on alerts, \`alerts [take|taketh|takewhatismine|takeadeepbreath]\` - Put yourself on alerts', channel);
        break;
    }
  }

}, true);

bot.respondTo('handover', (message, channel, user) => {
  let args = getArgs(message.text);

  switch(args[0]) {
    case 'add':
      handover.addTask(user.profile.first_name = user.profile.real_name, args.slice(1).join(' '), channel);
      break;

    case 'complete':
      handover.completeTask(user.profile.first_name = user.profile.real_name, parseInt(args[1], 10), channel);
      break;

    case 'delete':
      handover.removeTaskOrTodoList(user.profile.first_name = user.profile.real_name, args[1], channel);
      break;

    case 'help':
      bot.send('Show handover with \`handover list\`, add handover tasks with \`handover add [TASK]\`, complete them with \`handover complete [TASK_NUMBER]\` and remove them with \`handover delete [TASK_NUMBER]\` or \`handover delete all\`', channel);
      break;

    case 'list':
      handover.showHandover(user.profile.first_name = user.profile.real_name, channel);
      break;
  }
}, true);

const otto_opts = {
  host: 'SOME_URL',
  port: PORT_NO,
  path: 'PATH',
  headers: {
    'Authorization': 'Basic ' + new Buffer(data.OTTO.user + ':' + data.OTTO.pass).toString('base64')
  }
};

setInterval(function() {
  let today = moment().format('dddd')
  if (today !== 'Saturday' && today !== 'Sunday') {
    https.get(otto_opts, function(res){
      var body = "";
      res.on('data', function(data) {
        body += data;
      });
      res.on('end', function() {
        body = JSON.parse(body)
        if (body.length === 1) {
          sendRandom(`There is currently ${body.length} OTTO issue waiting in the queue.`, data.WEBHOOK_URL.teamops);
        } else if (body.length > 1){
            sendRandom(`There are currently ${body.length} OTTO issues waiting in the queue.`, data.WEBHOOK_URL.teamops);
        }
      });
      res.on('error', function(e) {
        console.log("Got error: " + e.message);
      });
    });
  }
}, 1800000);

bot.respondTo('otto-count$', (message, channel, user) => {
  https.get(otto_opts, function(res){
    var body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      body = JSON.parse(body)
      if (body.length < 1) {
        bot.send(`There are currently ${body.length} OTTO issues waiting in the queue. The queue is now empty! :happyhourparrot:`, channel);
      } else if (body.length > 1){
          bot.send(`There are currently ${body.length} OTTO issues waiting in the queue.`, channel);
      } else {
          bot.send(`There is currently ${body.length} OTTO issue waiting in the queue.`, channel);
      }
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}, true);

const pd_opts = {
  host: 'api.pagerduty.com',
  port: 443,
  path: '',
  headers: {
    'Accept': 'application/vnd.pagerduty+json;version=2', 'Authorization': 'Token token=' + data.PD.token
  }
};

var last_emerg_message = moment();
var last_normal_message = moment();

setInterval(function() {
  let since = encodeURIComponent(moment().toISOString());
  let until = encodeURIComponent(moment().add(1, 'days').toISOString());
  pd_opts.path = '/oncalls?time_zone=UTC&include%5B%5D=users&user_ids%5B%5D=' +
                  data.PD.userid + '&escalation_policy_ids%5B%5D=[VALUE]&schedule_ids%5B%5D=[VALUE]&since='
                  + since + '&until=' + until;
  https.get(pd_opts, function(res){
    let body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      let oncalls = JSON.parse(body)['oncalls'].sort((a,b) => ((moment(a.start).diff(moment(b.start)) > 0) ? 1: ((moment(a.start).diff(moment(b.start)) < 0) ? -1: 0)));
      let gaps_count = oncalls.length;
      let time_now = moment();
      if ( gaps_count > 0 ) {
        let latest_oncall_start = moment(oncalls[0]['start']);
        let most_recent = latest_oncall_start.format('HH:mm UTC, MMMM Do YYYY');
        if ( (latest_oncall_start.diff(time_now, 'minutes') > 240) && (time_now.diff(last_normal_message, 'minutes') > 60) ) {
          if (gaps_count > 1) {
            sendRandom(`Coverage gap is scheduled for ${gaps_count} hotseats within 24 hours. First hotseat begins at ${most_recent}.`, data.WEBHOOK_URL.teamops);
          } else if (gaps_count === 1) {
              sendRandom(`Coverage gap is scheduled for hotseat at ${most_recent}.`, data.WEBHOOK_URL.teamops);
          }
          last_normal_message = moment();
        }
      }
      oncalls.forEach(function(element){
        let start_time = moment(element['start']);
        let diff = start_time.diff(time_now, 'minutes');
        if ( diff < 240 ) {
          if ( time_now.diff(last_emerg_message, 'minutes') > 30 ) {
            let gap_time = start_time.format('HH:mm UTC, MMMM Do YYYY');
            sendRandom(`<!here> A coverage gap at ${gap_time} needs an assignee urgently!`, data.WEBHOOK_URL.teamops);
            last_emerg_message = moment();
          }
        }
      });
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });

  pd_opts.path = '/incidents?statuses%5B%5D=triggered&statuses%5B%5D=acknowledged&user_ids%5B%5D=' +
                  data.PD.userid + '&time_zone=UTC';
  https.get(pd_opts, function(res){
    let body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      let incidents = JSON.parse(body)['incidents'];
      let no_of_incidents = incidents.length;
      if (incidents > 1) {
        sendRandom(`<!here> There are ${no_of_incidents} incidents assigned to Mr. Coverage Gap in PagerDuty.`, data.WEBHOOK_URL.teamops)
      } else if (incidents === 1) {
        sendRandom(`<!here> There is ${no_of_incidents} incident assigned to Mr. Coverage Gap in PagerDuty.`, data.WEBHOOK_URL.teamops);
      }
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}, 120000);

bot.respondTo('pd', (message, channel, user) => {
  let args = getArgs(message.text);
  let until = encodeURIComponent(moment().add(1, 'days').toISOString());
  let hotseat = 'VALUE';
  let hotseat_sec = 'VALUE';
  let pd_cmd_opts = {
    host: 'api.pagerduty.com',
    port: 443,
    path: '/oncalls?time_zone=UTC&escalation_policy_ids%5B%5D=[VALUE]8&schedule_ids%5B%5D=' + hotseat +
    '&until=' + until + '&earliest=false',
    headers: {
      'Accept': 'application/vnd.pagerduty+json;version=2', 'Authorization': 'Token token=' + data.PD.token
    }
  };
  switch(args[0]) {
    case 'oncall':
      https.get(pd_cmd_opts, function(res){
        let body = "";
        res.on('data', function(data) {
          body += data;
        });
        res.on('end', function() {
          let oncall = JSON.parse(body)['oncalls'].sort(sort_oncalls)[0].user.summary;
          bot.send(`${oncall} is currently on hotseat.`, channel)
        });
        res.on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      });
      break;

    case 'oncall-next':
      https.get(pd_cmd_opts, function(res){
        let body = "";
        res.on('data', function(data) {
          body += data;
        });
        res.on('end', function() {
          let oncall = JSON.parse(body)['oncalls'].sort(sort_oncalls)[1].user.summary;
          bot.send(`${oncall} is next on hotseat.`, channel)
        });
        res.on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      });
      break;

    case 'sec':
      pd_cmd_opts.path = '/oncalls?time_zone=UTC&escalation_policy_ids%5B%5D=[VALUE]8&schedule_ids%5B%5D=' + hotseat_sec +
      '&until=' + until + '&earliest=false';
      https.get(pd_cmd_opts, function(res){
        let body = "";
        res.on('data', function(data) {
          body += data;
        });
        res.on('end', function() {
          let oncall = JSON.parse(body)['oncalls'].sort(sort_oncalls)[0].user.summary;
          bot.send(`${oncall} is currently on secondary hotseat.`, channel)
        });
        res.on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      });
      break;

    case 'sec-next':
      pd_cmd_opts.path = '/oncalls?time_zone=UTC&escalation_policy_ids%5B%5D=[VALUE]8&schedule_ids%5B%5D=' + hotseat_sec +
      '&until=' + until + '&earliest=false';
      https.get(pd_cmd_opts, function(res){
        let body = "";
        res.on('data', function(data) {
          body += data;
        });
        res.on('end', function() {
          let oncall = JSON.parse(body)['oncalls'].sort(sort_oncalls)[1].user.summary;
          bot.send(`${oncall} is next on secondary hotseat.`, channel)
        });
        res.on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      });
      break;

    case 'all':
      let escalation_policy = "";
      let schedule_id = "";
      for (var i = 0, len = escalation_policy_ids.length; i<len; i++){
         escalation_policy += "&escalation_policy_ids%5B%5D=" + escalation_policy_ids[i];
      }
      for (var i = 0, len = schedule_ids.length; i<len; i++){
         schedule_id += "&schedule_ids%5B%5D=" + schedule_ids[i];
      }
      let oncalls_name = {'Hotseat': 'None', 'Hotseat Secondary': 'None', 'Management': 'None', 'DBA-1': 'None',
      'DBA-2': 'None', 'Oncall Primary': 'None', 'Oncall Secondary': 'None', 'VCL': 'None'};
      pd_cmd_opts.path = '/oncalls?time_zone=UTC' + escalation_policy + schedule_id + '&earliest=true';
      https.get(pd_cmd_opts, function(res){
        let body = "";
        res.on('data', function(data) {
          body += data;
        });
        res.on('end', function() {
          let message = '';
          let oncalls = JSON.parse(body)['oncalls'].sort(sort_oncalls);
          oncalls.forEach(function(element) {
            switch(element.schedule.id) {
              case PD.SCHEDULES.HOTSEAT:
                 oncalls_name['Hotseat'] = element.user.summary;
              break;

              case PD.SCHEDULES.HOTSEAT_SEC:
                 oncalls_name['Hotseat Secondary'] = element.user.summary;
              break;

              case PD.SCHEDULES.OPS_MGT:
                 oncalls_name['Management'] = element.user.summary;
              break;

              case PD.SCHEDULES.OPS_DBA_1:
                 oncalls_name['DBA-1'] = element.user.summary;
              break;

              case PD.SCHEDULES.OPS_DBA_2:
                 oncalls_name['DBA-2'] = element.user.summary;
              break;

              case PD.SCHEDULES.ONCALL_PRIMARY:
                 oncalls_name['Oncall Primary'] = element.user.summary;
              break;

              case PD.SCHEDULES.ONCALL_SEC:
                 oncalls_name['Oncall Secondary'] = element.user.summary;
              break;

              case PD.SCHEDULES.OPS_VCL:
                 oncalls_name['VCL'] = element.user.summary;
              break;
            }
          });
          Object.keys(oncalls_name).forEach(function(key,index) {
            message += `_${key}_: \`${oncalls_name[key]}\`\n`
          });
          bot.send('>>>*Currently On-call (Ops):*\n' + message, channel);
        });
        res.on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      });
      break;

    case 'help':
      bot.send('Usage: \`pd oncall\` - Finds who is currently on hotseat, \`pd oncall-next\` - Finds who is next on hotseat, \`pd sec\` - Finds who is currently secondary, \`pd sec-next\` - Finds who is the next secondary, \`pd all\` - Lists all currently oncall for Ops', channel);
      break;
  }
}, true);

bot.respondTo('opsbot help$', (message, channel, user) => {
  bot.send('\`pd help\` - For PagerDuty oncall check, \`otto-count\` - Find the no. of OTTO issues in the queue, \`alerts help\` - Ways to take alerts / Ping someone on alerts, \`handover help\` - Keep a track of handover between hotseats, \`greetings help\` - Ways to greet', channel);
}, true);

bot.respondTo('greetings help$', (message, channel, user) => {
  bot.send('\`[hello/hi/good morning/gm/good evening/good afternoon/gday/morning] [ops/team/folks/chaps/opsians/people]\`, \`[goodbye/bbye/bye/see ya/see ya later/later/cya/seeya/cheerio] [chaps/folks/team/ops/opsians/people]\` - Ways to greet', channel);
}, true);

setInterval(function() {
  fs.readFile('client.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    opscalendar.authorize(JSON.parse(content), opscalendar.listEvents);
  });
}, 60000);

setInterval(function() {
  let until = encodeURIComponent(moment().add(1, 'days').toISOString());
  let since = encodeURIComponent(moment().add(5, 'minutes').toISOString());
  let hotseat = 'P9Z0CUO';
  let hotseat_secondary = 'PT71L3I';
  let oncall_time_check = moment();
  let pd_oncall_opts = {
    host: 'api.pagerduty.com',
    port: 443,
    path: '/oncalls?time_zone=UTC&include%5B%5D=users&escalation_policy_ids%5B%5D=[VALUE]8&schedule_ids%5B%5D=' +
    hotseat + '&until=' + until + '&earliest=false',
    headers: {
      'Accept': 'application/vnd.pagerduty+json;version=2', 'Authorization': 'Token token=' + data.PD.token
    }
  };

  https.get(pd_oncall_opts, function(res){
    let body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      let primary = JSON.parse(body)['oncalls'].sort((a,b) => ((moment(a.start).diff(moment(b.start)) > 0) ? 1: ((moment(a.start).diff(moment(b.start)) < 0) ? -1: 0)))[1];
      let primary_name = primary.user.name;
      let oncall_start = moment(primary.start);
      let oncall_end = moment(primary.end);
      let duration = oncall_end.diff(oncall_start, 'hours');
      if (oncall_start.diff(oncall_time_check, 'minutes') === 1) {
        pd_oncall_opts.path = '/oncalls?time_zone=UTC&include%5B%5D=users&escalation_policy_ids%5B%5D=[VALUE]8&schedule_ids%5B%5D=' +
        hotseat_secondary + '&since=' + since + '&until=' + until + '&earliest=false';
        https.get(pd_oncall_opts, function(res){
          let body = "";
          res.on('data', function(data) {
            body += data;
          });
          res.on('end', function() {
            let sec_name = JSON.parse(body)['oncalls'].sort((a,b) => ((moment(a.start).diff(moment(b.start)) > 0) ? 1: ((moment(a.start).diff(moment(b.start)) < 0) ? -1: 0)))[0].user.summary;
            request
            .post(data.WEBHOOK_URL.teamops)
            .send({
            "text": "Going On Call for the next " + duration + " hours (Ops):",
            "attachments": [
                {
                    "color": "#18AB82",
                    "fields": [
                        {
                            "title": "Primary",
                            "value": primary_name,
                            "short": true
                        },
                        {
                            "title": "Secondary",
                            "value": sec_name,
                            "short": true
                        }
                    ]
                }
            ]
            })
            .end((err, res) => { if (err)
            console.log(err);
            });
          });
          res.on('error', function(e) {
            console.log("Got error: " + e.message);
          });
        });
      }
    });
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
}, 60000);
