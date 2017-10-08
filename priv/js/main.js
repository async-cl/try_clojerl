var Connection = function(url) {
  var self = this;

  this._conn = new WebSocket(url);
  this._conn.onmessage = function(message) {
    self.onmessage(message);
  };

  self.send = function(data) {
    self._conn.send(data);
  };

  self.onmessage = function(message) {
    console.log(message);
  };
};

var callIfNotEmpty = function(value, f) {
  value && value.trim() != "" && f(value);
};

var init = function() {
  var url  = "ws://" + window.location.host + "/repl";
  var conn = new Connection(url);
  var oninit = function() {
    var term = this;
    conn.onmessage = function(message) {
      var json = JSON.parse(message.data);
      callIfNotEmpty(json.stdout, term.echo);
      callIfNotEmpty(json.stderr, term.error);
      callIfNotEmpty(json.result, term.echo);
      term.set_prompt(json.prompt);
    };
  };

  var options = {
    greetings: 'Welcome to Try Clojerl!',
    height: '100%',
    prompt: 'clje.user=> ',
    onInit: oninit
  };

  $('#terminal').terminal(function(command) {
    if (command.trim() !== '') {
      try {
        var message = {cmd: command};
        conn.send(JSON.stringify(message));
      } catch(e) {
        this.error(new String(e));
      }
    } else {
      this.echo('');
    }
  }, options);
};

$(function($, undefined) { init(); });
