// WebSocket URL
const URL = "ws://" + window.location.host + "/repl";
const MAX_ATTEMPTS = 10;

var Connection = function(url) {
  var self = this;

  this._conn = new WebSocket(url);
  this._conn.onopen    = function(message) { self.onopen(message); };
  this._conn.onmessage = function(message) { self.onmessage(message); };
  this._conn.onclose   = function(message) { self.onclose(message); };
  this._conn.onerror   = function(message) { self.onerror(message); };

  // Default handler
  self.onopen    = console.log;
  self.onmessage = console.log;
  self.onerror   = console.log;
  self.onclose   = console.log;

  self.send = function(data) {
    self._conn.send(data);
  };
};

var init = function() {
  var self = this;
  self._conn = new Connection(URL);
  self._term = $('#terminal').console({
    promptLabel: 'clje.user=> ',
    commandValidate: function(command) {
      return true;
    },
    commandHandle: function(command) {
      self.eval(command);
      // Enable the input since sometimes it
      // stays disabled
      self._term.enableInput();
    },
    autofocus:true,
    animateScroll:true,
    promptHistory:true
  });

  self.clientCount = function(count) {
    if(count) {
      var label = count + " " + (count === 1? "client" : "clients");
      $('#client-count').text(label);
    }
  };

  self.error = function(message) {
    self._term.commandResult([{msg: message, className: 'stderr'}]);
  };

  self.eval = function(command) {
    if (command.trim() !== '') {
      var message = {cmd: command};
      self._conn.send(JSON.stringify(message));
    } else {
      self._term.commandResult();
    }
  };

  self.print = function(json) {
    self._term.promptLabel = json.prompt;
    self._term.report(json.message, 'stdout');
    self.clientCount(json.client_count);

    if( json.result != undefined ||
        json.stdout != undefined ||
        json.stderr != undefined
      ) {
      var msgs = [ {msg: json.stdout, className: 'stdout'},
                   {msg: json.stderr, className: 'stderr'},
                   {msg: json.result, className: 'result'}
                 ];
      self._term.commandResult(msgs);
    }
  };

  self._conn.onopen = function(message) {
    self._attempts = 0;
    self._term.report("WebSocket connection established");
  };

  self._conn.onmessage = function(message) {
    var json = JSON.parse(message.data);
    self.print(json);
  };

  self._conn.onclose = function() {
    if(self._attempts < MAX_ATTEMPTS) {
      var timeout = Math.pow(2, self._attempts) * 10;
      self.error("WebSocket connection lost. Trying to reconnect...");
      setTimeout(function() {
        self._attempts += 1;
        var conn       = new Connection(URL);
        conn.onopen    = self._conn.onopen;
        conn.onmessage = self._conn.onmessage;
        conn.onclose   = self._conn.onclose;
        conn.onerror   = self._conn.onerror;
        self._conn     = conn;
      }, timeout);
    } else {
      self.error("Maximum reconnection attempts reached");
    }
  };
};

$(function() {
  if($('#terminal').length) {
    init();
  }
});
