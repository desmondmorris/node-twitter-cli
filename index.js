var
  fs = require('fs'),
  path = require('path'),
  file = path.join(process.env.HOME, '.twitter-cli'),
  argv = require('optimist').argv,
  request = require('request'),
  es = require('event-stream');

fs.readFile(file, function(e, d) {
  if (e) {
    console.log("Please create a ~/.twitter-cli file with your creds")
    console.log([
      '{',
      '  "consumer_key": "X"',
      '  "consumer_secret": "X"',
      '  "token": "X",',
      ' "token_secret": "X"',
      '}'
    ].join('\n'));

    return;
  }

  var oauth = JSON.parse(d.toString());

  var req = request({
    method : 'POST',
    url : 'https://stream.twitter.com/1.1/statuses/filter.json',
    form : { track : argv.filter },
    oauth : oauth
  });

  es.pipeline(
    req,
    es.map(function(data, callback) {
      var obj = {};
      try { obj = JSON.parse(data); } catch(e) {}

      var out = obj.text;

      if (argv.regex) {
        var matches = out.match(new RegExp(argv.regex));

        if (matches) {
          callback(null, matches[0] + '\n');
        }
      } else {
        callback(null, out);
      }

    }),
    process.stdout
  );

});

process.on('uncaughtException', function(e) {
  console.log(e.stack);
  process.exit();
});

