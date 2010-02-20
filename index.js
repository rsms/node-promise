/**
 * Chainable promises for node.
 *
 * Simple usage:
 *
 * promise(fs.open, filename)(function(err, fd){
 *   // Called when fs.open "returns"
 * })(function(err, fd){
 *   // Also called when fs.open "returns"
 * })
 *
 * Chaining:
 *
 * promise(fs.stat, filename)
 *  .then(fs.open, filename)
 *  .then(function(fd){
 *    return promise(fs.read, fd, 1024)(function(){ fs.close(fd); })
 *  })
 *  (function(err, data){
 *    if (err) throw err;
 *    else puts('read '+data.length+' bytes');
 *  })
 *
 * Will first stat the file, then when stat successfully returns invoke
 * fs.open, when fs.open successfully returns invoke fs.read with a manual
 * parameter '1024' and when fs.read successfully completes, close the file
 * and finally when fs.close returns successfully write out "done" to stdout.
 *
 * If an error occurs in the middle of the chain (e.g. at fs.open), the chain
 * is broken and the outer promise is closed (called) with the error.
 *
 * @author  Rasmus Andersson <http://hunch.se/>
 * @license MIT
 */

function promisev(args) {
  var cb = args[0];
  var cl = mkpromise(cb);
  if (cb) {
    args = Array.prototype.slice.call(args, 1);
    args.push(cl.close);
    cb.apply(cb, args);
  }
  return cl;
}
function promise(fun) {
  var cl = mkpromise(fun);
  if (fun) {
    var cargs = Array.prototype.slice.call(arguments, 1);
    cargs.push(cl.close);
    fun.apply(fun, cargs);
  }
  return cl;
}
exports.promise = promise;

function mkpromise(context){
  var c = function(cb){
    if (cb.__isClosure) cb = cb.close;
    if (c.fired) cb.apply(context || c, c.args || []);
    else c.callbacks.push(cb);
    return c;
  }
  if (context) c.context = context;
  c.__isClosure = true;
  c.callbacks = [];
  c.addCallback = c; // alias
  c.removeCallback = function(cb) {
    c.callbacks = c.callbacks.filter(function(item){ item !== cb; });
    return c;
  }
  c.closev = function(args) {
    if (!c.fired) {
      if (args) c.args = Array.prototype.slice.call(args);
      c.fired = true;
      c.callbacks.forEach(function(cb){
        cb.apply(context || c, c.args || []);
      });
    }
    return c;
  }
  c.close = function(/*[err, arg, ..]*/) {
    return c.closev(arguments);
  }
  c.then = function (cb) {
    if (!cb || typeof cb !== 'function') {
      // if we did not get any there's no callback to chain:
      return c;
    }
    // A new promise which keeps a queue of callbacks
    var c2 = mkpromise();
    c2.__thenQueue = [arguments];
    var _closev = c2.closev;
    c2.closev = function(prevArgs){
      if (c2.fired)
        return c2;
      var next = c2.__thenQueue.shift();
      // unroll on error or when the queue is empty
      if (next === undefined || prevArgs[0]) {
        return _closev(prevArgs);
      }
      else {
        // slice away the empty error when passing arguments to the next cb
        try {
          var nextCb = next[0];
          if (!nextCb.__isClosure && next.length > 1)
            promisev(next)(c2.close);
          else
            nextCb.apply(c2.context || c2, Array.prototype.slice.call(prevArgs,1))(c2.close);
        }
        catch (exc) {
          c2.close(exc);
        }
      }
      return c2;
    }
    c2.then = function(cb) {
      if (c2.fired) {
        cb.apply(c2.context || c2, 
          arguments.length > 1 ? Array.prototype.slice.call(arguments,1) 
                               : (c2.args || []));
      }
      else {
        c2.__thenQueue.push(arguments);
      }
      return c2;
    }
    // Add the promise queue as a listener to the current promise
    c(c2);
    // return the queueable promise (optimization)
    return c2;
  }
  return c;
}
