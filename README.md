# Chainable promises for node

## Usage:
### Simple:

    promise(fs.open, filename)(function(err, fd){
      // Called when fs.open "returns"
    })(function(err, fd){
      // Also called when fs.open "returns"
    })

### Chaining:

    promise(fs.stat, __filename)
      .then(fs.cat, __filename)
      (function(err, data){
        if (err) throw err;
        else sys.puts('successfully read '+data.length+' bytes.');
      })

If an error occurs in the middle of the chain (e.g. at fs.stat), the chain
is broken and the outer promise is closed (called) with the error.

### Closing promises:

    function myAsyncFunction(fn) {
      var p = promise();
      // at some point in time or right now:
      p.close(error, result);
      return p;
    }

Promises can be passed on through your code where arbitrary machinery might
add callbacks and/or "links to the chain".

## MIT license

Copyright (c) 2010 [Rasmus Andersson](http://hunch.se/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
