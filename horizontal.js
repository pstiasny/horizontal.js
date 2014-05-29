(function() {
    var _root = this;
    var _h = function(col) { return (col && col.__wrapped___) ? col : new wrap(_h.enumerate(col)); };

    _h.enumerateArray = function(col) {
        var i = 0;
        return {
            next: function() { return col[i++]; },
            hasMore: function() { return i < col.length; }
        };
    };

    _h.nullEnumerator = {
        next: function() { return undefined; },
        hasMore: function() { return false; }
    };

    _h.enumerate = function(col) {
        if (!col) return _h.nullEnumerator;
        if (col.next !== undefined && col.hasMore !== undefined) return col;
        if (col.length !== undefined) return _h.enumerateArray(col);
        return _h.nullEnumerator;
    }

    _h.range = function(arg1, arg2) {
        var lower, upper, i;
        if (arg2 !== undefined) {
            lower = arg1; upper = arg2;
        } else {
            lower = 0; upper = arg1;
        }

        i = lower;
        return new wrap({
            next: function() { return i++; },
            hasMore: function() { return i < upper; }
        });
    }

    _h.repeat = function(ar) {
        var i = 0;
        return new wrap({
            next: function() {
                var r = ar[i++];
                if (i >= ar.length) i = 0;
                return r;
            },
            hasMore: function() { return true; }
        });
    }

    var shared_functions = {

        take: function(enumerator, count) {
            var i = 0;
            return {
                next: function() { i++; return enumerator.next(); },
                hasMore: function() { return i < count && enumerator.hasMore(); }
            };
        },

        map: function(enumerator, mapper) {
            return {
                next: function() { return mapper(enumerator.next()); },
                hasMore: function() { return enumerator.hasMore(); }
            };
        },

        reduce: function(enumerator, reducer, initial) {
            var acc = initial;
            while(enumerator.hasMore())
                acc = reducer(acc, enumerator.next());
            return acc;
        },

        filter: function(enumerator, predicate) {
            var last_good, last;
            var eat_some = function() {
                while (enumerator.hasMore() && !predicate(last = enumerator.next()));
            };
            eat_some();

            return {
                next: function() { last_good = last; eat_some(); return last_good; },
                hasMore: function() { return enumerator.hasMore(); }
            };
        },

        each: function(enumerator, iterator) {
            while(enumerator.hasMore())
                iterator(enumerator.next());
        },

        toArray: function(enumerator) {
            var a = [];
            while(enumerator.hasMore())
                a.push(enumerator.next());
            return a;
        }

    }

    var wrap = function(value) {
        this.__wrapped__ = value;
    };
    var fname;
    for (fname in shared_functions) {
        var f = shared_functions[fname];
        _h[fname] = f;
        var helper = function(fname, f) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this.__wrapped__);
                if (['toArray', 'reduce', 'each'].indexOf(fname) !== -1) {
                    return f.apply(null, args);
                } else {
                    return new wrap(f.apply(null, args));
                }
            };
        };
        wrap.prototype[fname] = helper(fname, f)
    }

    _root._h = _h;
})();
