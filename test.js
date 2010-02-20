var sys = require('sys'),
    fs = require('fs'), 
    assert = require('assert'),
    promise = require('./index').promise;

// Monkey-patch old node for the sake of testing (<0.1.30)
var v = process.version.substr(1).split(/[.-]+/,3).map(Number);
if (v[0]<1&&v[1]<2&&v[2]<30) {
  var fs_stat = fs.stat;
  fs.stat = function(fn, cb) {
    fs_stat(fn)
    .addCallback(function(stats){ cb(null, stats); })
    .addErrback(function(err){ cb(err); });
  }
  var fs_cat = fs.cat;
  fs.cat = function(fn, cb) {
    fs_cat(fn)
    .addCallback(function(data){ cb(null, data); })
    .addErrback(function(err){ cb(err); });
  }
}

// -------------------------------
// Example program, reading a file

function readfile(filename, cb) {
  if (!cb) {
    var stats = fs.statSync(filename);
    if (!stats.isFile())
      throw new Error('not a file');
    return fs.catSync(filename);
  }
  else {
    fs.stat(filename, function(err, stats){
      if (err || (!stats.isFile() && (err = new Error('not a file'))))
        cb(err);
      else
        fs.cat(filename, cb);
    });
  }
}

// synchronous
var data = readfile(__filename);
sys.puts('successfully read '+data.length+' bytes.');

// asynchronous
var cl = promise(readfile, __filename)(function(err, data){
  if (err) throw err;
  else sys.puts('successfully read '+data.length+' bytes.');
})

// asynchronous by chaining
promise(fs.stat, __filename).then(fs.cat, __filename)(function(err, data){
  if (err) throw err;
  else sys.puts('successfully read '+data.length+' bytes.');
})

// -------------------------------
// Test then()

function fdirect(arg) {
  sys.puts('fdirect called');
  return promise().close(0, arg);
}

for (var i=5;i;i--) {
  eval("function f"+i+"(arg) {\
    sys.puts('f"+i+" called');\
    var cl = promise();"+
    (i>1 ? "assert.equal(arg, 'return value from f"+(i-1)+"');" : "")+
    "setTimeout(function(){\
      sys.puts('f"+i+" returning');"+
      (i===4?
        "cl.close(new Error('thrown in f"+i+"'));"
      :
        "cl.close(0,'return value from f"+i+"');"
      )+
    "}, 100);\
    return cl;\
  }");
}

// This should print calls in sequential order:
// f1 called
// f1 returning
// fdirect called
// f2 called
// ...
// f4 returning
// test OK
var did_throw_f4err = false;
cl.then(f1).then(fdirect).then(f2).then(f3).then(f4).then(f5)
(function(err, args){
  if (err) {
    if (err.message === 'thrown in f4') {
      did_throw_f4err = true;
    }
    else {
      throw err;
    }
  }
  sys.puts('test OK');
})

process.addListener("exit", function () {
  process.assert(did_throw_f4err === true);
});
