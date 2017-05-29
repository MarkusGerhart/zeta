/**
*
*   AceGrammar
*   @version: 0.8.5
*
*   Transform a grammar specification in JSON format, into an ACE syntax-highlight parser mode
*   https://github.com/foo123/ace-grammar
*
**/!function ( root, name, deps, factory ) {
    "use strict";
    
    //
    // export the module umd-style (with deps bundled-in or external)
    
    // Get current filename/path
    function getPath( isNode, isWebWorker, isAMD, isBrowser, amdMod ) 
    {
        var f;
        if (isNode) return {file:__filename, path:__dirname};
        else if (isWebWorker) return {file:(f=self.location.href), path:f.split('/').slice(0, -1).join('/')};
        else if (isAMD&&amdMod&&amdMod.uri)  return {file:(f=amdMod.uri), path:f.split('/').slice(0, -1).join('/')};
        else if (isBrowser&&(f=document.getElementsByTagName('script'))&&f.length) return {file:(f=f[f.length - 1].src), path:f.split('/').slice(0, -1).join('/')};
        return {file:null,  path:null};
    }
    function getDeps( names, paths, deps, depsType, require/*offset*/ )
    {
        //offset = offset || 0;
        var i, dl = names.length, mods = new Array( dl );
        for (i=0; i<dl; i++) 
            mods[ i ] = (1 === depsType)
                    ? /* node */ (deps[ names[ i ] ] || require( paths[ i ] )) 
                    : (2 === depsType ? /* amd args */ /*(deps[ i + offset ])*/ (require( names[ i ] )) : /* globals */ (deps[ names[ i ] ]))
                ;
        return mods;
    }
    // load javascript(s) (a)sync using <script> tags if browser, or importScripts if worker
    function loadScripts( scope, base, names, paths, callback, imported )
    {
        var dl = names.length, i, rel, t, load, next, head, link;
        if ( imported )
        {
            for (i=0; i<dl; i++) if ( !(names[ i ] in scope) ) importScripts( base + paths[ i ] );
            return callback( );
        }
        head = document.getElementsByTagName("head")[ 0 ]; link = document.createElement( 'a' );
        rel = /^\./; t = 0; i = 0;
        load = function( url, cb ) {
            var done = 0, script = document.createElement('script');
            script.type = 'text/javascript'; script.language = 'javascript';
            script.onload = script.onreadystatechange = function( ) {
                if (!done && (!script.readyState || script.readyState == 'loaded' || script.readyState == 'complete'))
                {
                    done = 1; script.onload = script.onreadystatechange = null;
                    cb( );
                    head.removeChild( script ); script = null;
                }
            }
            if ( rel.test( url ) ) 
            {
                // http://stackoverflow.com/a/14781678/3591273
                // let the browser generate abs path
                link.href = base + url;
                url = link.protocol + "//" + link.host + link.pathname + link.search + link.hash;
            }
            // load it
            script.src = url; head.appendChild( script );
        };
        next = function( ) {
            if ( names[ i ] in scope )
            {
                if ( ++i >= dl ) callback( );
                else if ( names[ i ] in scope ) next( ); 
                else load( paths[ i ], next );
            }
            else if ( ++t < 30 ) { setTimeout( next, 30 ); }
            else { t = 0; i++; next( ); }
        };
        while ( i < dl && (names[ i ] in scope) ) i++;
        if ( i < dl ) load( paths[ i ], next );
        else callback( );
    }
    
    deps = deps || [[],[]];
    
    var isNode = ("undefined" !== typeof global) && ("[object global]" === {}.toString.call(global)),
        isBrowser = !isNode && ("undefined" !== typeof navigator), 
        isWebWorker = !isNode && ("function" === typeof importScripts) && (navigator instanceof WorkerNavigator),
        isAMD = ("function" === typeof define) && define.amd,
        isCommonJS = isNode && ("object" === typeof module) && module.exports,
        currentGlobal = isWebWorker ? self : root, currentPath = getPath( isNode, isWebWorker, isAMD, isBrowser ), m,
        names = [].concat(deps[0]), paths = [].concat(deps[1]), dl = names.length, i, requireJSPath, ext_js = /\.js$/i
    ;
    
    // commonjs, node, etc..
    if ( isCommonJS ) 
    {
        module.$deps = module.$deps || {};
        module.exports = module.$deps[ name ] = factory.apply( root, [{NODE:module}].concat(getDeps( names, paths, module.$deps, 1, require )) ) || 1;
    }
    
    // amd, requirejs, etc..
    else if ( isAMD && ("function" === typeof require) && ("function" === typeof require.specified) &&
        require.specified(name) ) 
    {
        if ( !require.defined(name) )
        {
            requireJSPath = { };
            for (i=0; i<dl; i++) 
                require.specified( names[ i ] ) || (requireJSPath[ names[ i ] ] = paths[ i ].replace(ext_js, ''));
            //requireJSPath[ name ] = currentPath.file.replace(ext_js, '');
            require.config({ paths: requireJSPath });
            // named modules, require the module by name given
            define( name, ["require", "exports", "module"].concat( names ), function( require, exports, module ) {
                return factory.apply( root, [{AMD:module}].concat(getDeps( names, paths, arguments, 2, require )) );
            });
        }
    }
    
    // browser, web worker, other loaders, etc.. + AMD optional
    else if ( !(name in currentGlobal) )
    {
        loadScripts( currentGlobal, currentPath.path + '/', names, paths, function( ){ 
            currentGlobal[ name ] = m = factory.apply( root, [{}].concat(getDeps( names, paths, currentGlobal )) ) || 1; 
            isAMD && define( name, ["require"], function( ){ return m; } );
        }, isWebWorker);
    }


}(  /* current root */          this, 
    /* module name */           "AceGrammar",
    /* module dependencies */   [ ['Classy', 'RegExAnalyzer'],  ['./classy.js', './regexanalyzer.js'] ], 
    /* module factory */        function( exports, Classy, RegexAnalyzer, undef ) {
        
    /* main code starts here */

        
    //
    // parser types
    var    
        DEFAULTSTYLE,
        DEFAULTERROR,
        
        //
        // javascript variable types
        INF = Infinity,
        T_NUM = 2,
        T_NAN = 3,
        //T_INF = 3,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR = 9,
        T_CHARLIST = 10,
        T_ARRAY = 16,
        T_OBJ = 32,
        T_FUNC = 64,
        T_REGEX = 128,
        T_NULL = 256,
        T_UNDEF = 512,
        T_UNKNOWN = 1024,
        
        //
        // matcher types
        T_SIMPLEMATCHER = 2,
        T_COMPOSITEMATCHER = 4,
        T_BLOCKMATCHER = 8,
        
        //
        // token types
        T_ERROR = 4,
        T_DEFAULT = 8,
        T_SIMPLE = 16,
        T_EOL = 17,
        T_NONSPACE = 18,
        T_EMPTY = 20,
        T_BLOCK = 32,
        T_ESCBLOCK = 33,
        T_COMMENT = 34,
        T_EITHER = 64,
        T_ALL = 128,
        T_REPEATED = 256,
        T_ZEROORONE = 257,
        T_ZEROORMORE = 258,
        T_ONEORMORE = 259,
        T_GROUP = 512,
        T_NGRAM = 1024,
        T_INDENT = 2048,
        T_DEDENT = 4096,
        
        //
        // tokenizer types
        groupTypes = {
            EITHER: T_EITHER, ALL: T_ALL, 
            ZEROORONE: T_ZEROORONE, ZEROORMORE: T_ZEROORMORE, ONEORMORE: T_ONEORMORE, 
            REPEATED: T_REPEATED
        },
        
        tokenTypes = {
            INDENT: T_INDENT, DEDENT: T_DEDENT,
            BLOCK: T_BLOCK, COMMENT: T_COMMENT, ESCAPEDBLOCK: T_ESCBLOCK, 
            SIMPLE: T_SIMPLE, GROUP: T_GROUP, NGRAM: T_NGRAM
        }
    ;
    
    var Class = Classy.Class;
    
    var AP = Array.prototype, OP = Object.prototype, FP = Function.prototype,
        slice = FP.call.bind(AP.slice), concat = AP.concat,
        hasKey = FP.call.bind(OP.hasOwnProperty), toStr = FP.call.bind(OP.toString), 
        isEnum = FP.call.bind(OP.propertyIsEnumerable), Keys = Object.keys,
        
        get_type = Classy.Type,

        make_array = function(a, force) {
            return ( force || T_ARRAY != get_type( a ) ) ? [ a ] : a;
        },
        
        make_array_2 = function(a, force) {
            a = make_array( a, force );
            if ( force || T_ARRAY != get_type( a[0] ) ) a = [ a ]; // array of arrays
            return a;
        },
        
        clone = function(o) {
            var T = get_type( o ), T2;
            
            if ( !((T_OBJ | T_ARRAY) & T) ) return o;
            
            var co = {}, k;
            for (k in o) 
            {
                if ( hasKey(o, k) && isEnum(o, k) ) 
                { 
                    T2 = get_type( o[k] );
                    
                    if (T_OBJ & T2)  co[k] = clone(o[k]);
                    
                    else if (T_ARRAY & T2)  co[k] = o[k].slice();
                    
                    else  co[k] = o[k]; 
                }
            }
            return co;
        },
        
        extend = function() {
            var args = slice(arguments), argslen = args.length;
            
            if ( argslen<1 ) return null;
            else if ( argslen<2 ) return clone( args[0] );
            
            var o1 = args.shift(), o2, o = clone(o1), i, k, T; 
            argslen--;            
            
            for (i=0; i<argslen; i++)
            {
                o2 = args.shift();
                if ( !o2 ) continue;
                
                for (k in o2) 
                { 
                    if ( hasKey(o2, k) && isEnum(o2, k) )
                    {
                        if ( hasKey(o1, k) && isEnum(o1, k) ) 
                        { 
                            T = get_type( o1[k] );
                            
                            if ( (T_OBJ & ~T_STR) & T)  o[k] = extend( o1[k], o2[k] );
                            
                            //else if (T_ARRAY == T)  o[k] = o1[k].slice();
                            
                            //else  o[k] = o1[k];
                        }
                        else
                        {
                            o[k] = clone( o2[k] );
                        }
                    }
                }
            }
            return o;
        },
        
        escRegexp = function(str) {
            return str.replace(/([.*+?^${}()|[\]\/\\\-])/g, '\\$1');
        },
        
        groupReplace = function(pattern, token) {
            var parts, i, l, replacer;
            replacer = function(m, d){
                // the regex is wrapped in an additional group, 
                // add 1 to the requested regex group transparently
                return token[ 1 + parseInt(d, 10) ];
            };
            parts = pattern.split('$$');
            l = parts.length;
            for (i=0; i<l; i++) parts[i] = parts[i].replace(/\$(\d{1,2})/g, replacer);
            return parts.join('$');
        },
        
        byLength = function(a, b) { return b.length - a.length },
        
        hasPrefix = function(s, id) {
            return (
                (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
                id.length <= s.length && id == s.substr(0, id.length)
            );
        },
        
        getRegexp = function(r, rid, cachedRegexes)  {
            if ( !r || (T_NUM == get_type(r)) ) return r;
            
            var l = (rid) ? (rid.length||0) : 0, i;
            
            if ( l && rid == r.substr(0, l) ) 
            {
                var regexSource = r.substr(l), delim = regexSource[0], flags = '',
                    regexBody, regexID, regex, chars, analyzer, i, ch
                ;
                
                // allow regex to have delimiters and flags
                // delimiter is defined as the first character after the regexID
                i = regexSource.length;
                while ( i-- )
                {
                    ch = regexSource[i];
                    if (delim == ch) 
                        break;
                    else if ('i' == ch.toLowerCase() ) 
                        flags = 'i';
                }
                regexBody = regexSource.substring(1, i);
                regexID = "^(" + regexBody + ")";
                //console.log([regexBody, flags]);
                
                if ( !cachedRegexes[ regexID ] )
                {
                    regex = new RegExp( regexID, flags );
                    analyzer = new RegexAnalyzer( regex ).analyze();
                    chars = analyzer.getPeekChars();
                    if ( !Keys(chars.peek).length )  chars.peek = null;
                    if ( !Keys(chars.negativepeek).length )  chars.negativepeek = null;
                    
                    // shared, light-weight
                    cachedRegexes[ regexID ] = [ regex, chars ];
                }
                
                return cachedRegexes[ regexID ];
            }
            else
            {
                return r;
            }
        },
        
        getCombinedRegexp = function(tokens, boundary)  {
            var peek = { }, i, l, b = "", bT = get_type(boundary);
            if ( T_STR == bT || T_CHAR == bT ) b = boundary;
            var combined = tokens
                        .sort( byLength )
                        .map( function(t) {
                            peek[ t.charAt(0) ] = 1;
                            return escRegexp( t );
                        })
                        .join( "|" )
                    ;
            return [ new RegExp("^(" + combined + ")"+b), { peek: peek, negativepeek: null }, 1 ];
        },
        
        _id_ = 0, getId = function() { return ++_id_; },
        
        isNode = (typeof global !== "undefined" && {}.toString.call(global) == '[object global]') ? 1 : 0,
        isBrowser = (!isNode && typeof navigator !== "undefined") ? 1 : 0, 
        isWorker = (typeof importScripts === "function" && navigator instanceof WorkerNavigator) ? 1 : 0,
        
        // Get current filename/path
        getCurrentPath = function() {
            var file = null, path, base, scripts;
            if ( isNode ) 
            {
                // http://nodejs.org/docs/latest/api/globals.html#globals_filename
                // this should hold the current file in node
                file = __filename;
                return { path: __dirname, file: __filename, base: __dirname };
            }
            else if ( isWorker )
            {
                // https://developer.mozilla.org/en-US/docs/Web/API/WorkerLocation
                // this should hold the current url in a web worker
                file = self.location.href;
            }
            else if ( isBrowser )
            {
                // get last script (should be the current one) in browser
                base = document.location.href.split('#')[0].split('?')[0].split('/').slice(0, -1).join('/');
                if ((scripts = document.getElementsByTagName('script')) && scripts.length) 
                    file = scripts[scripts.length - 1].src;
            }
            
            if ( file )
                return { path: file.split('/').slice(0, -1).join('/'), file: file, base: base };
            return { path: null, file: null, base: null };
        },
        thisPath = getCurrentPath()
    ;
    
    //
    // Stream Class
    var
        Max = Math.max, spcRegex = /^[\s\u00a0]+/, spc = /[^\s\u00a0]/,
        // Counts the column offset in a string, taking tabs into account.
        // Used mostly to find indentation.
        // adapted from CodeMirror
        countColumn = function(string, end, tabSize, startIndex, startValue) {
            var i, n;
            if ( null === end ) 
            {
                end = string.search(spc);
                if ( -1 == end ) end = string.length;
            }
            for (i = startIndex || 0, n = startValue || 0; i < end; ++i) 
                n += ( "\t" == string.charAt(i) ) ? (tabSize - (n % tabSize)) : 1;
            return n;
        },
        
        // a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
        Stream = Class({
            
            constructor: function( line ) {
                var ayto = this;
                ayto._ = null;
                ayto.s = (line) ? ''+line : '';
                ayto.start = ayto.pos = 0;
                ayto.lCP = ayto.lCV = 0;
                ayto.lS = 0;
            },
            
            // abbreviations used for optimal minification
            _: null,
            s: '',
            start: 0,
            pos: 0,
            // last column pos
            lCP: 0,
            // last column value
            lCV: 0,
            // line start
            lS: 0,
            
            toString: function( ) { return this.s; },
            
            fromStream: function( _ ) {
                var ayto = this;
                ayto._ = _;
                ayto.s = ''+_.string;
                ayto.start = _.start;
                ayto.pos = _.pos;
                ayto.lCP = _.lastColumnPos;
                ayto.lCV = _.lastColumnValue;
                ayto.lS = _.lineStart;
                return ayto;
            },
            
            // string start-of-line?
            sol: function( ) { return 0 == this.pos; },
            
            // string end-of-line?
            eol: function( ) { return this.pos >= this.s.length; },
            
            // char match
            chr: function( pattern, eat ) {
                var ayto = this, ch = ayto.s.charAt(ayto.pos) || null;
                if (ch && pattern == ch) 
                {
                    if (false !== eat) 
                    {
                        ayto.pos += 1;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // char list match
            chl: function( pattern, eat ) {
                var ayto = this, ch = ayto.s.charAt(ayto.pos) || null;
                if ( ch && (-1 < pattern.indexOf( ch )) ) 
                {
                    if (false !== eat) 
                    {
                        ayto.pos += 1;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // string match
            str: function( pattern, startsWith, eat ) {
                var ayto = this, len, pos = ayto.pos, str = ayto.s, ch = str.charAt(pos) || null;
                if ( ch && startsWith[ ch ] )
                {
                    len = pattern.length; 
                    if (pattern == str.substr(pos, len)) 
                    {
                        if (false !== eat) 
                        {
                            ayto.pos += len;
                            if ( ayto._ ) ayto._.pos = ayto.pos;
                        }
                        return pattern;
                    }
                }
                return false;
            },
            
            // regex match
            rex: function( pattern, startsWith, notStartsWith, group, eat ) {
                var ayto = this, match, pos = ayto.pos, str = ayto.s, ch = str.charAt(pos) || null;
                if ( ch && ( startsWith && startsWith[ ch ] ) || ( notStartsWith && !notStartsWith[ ch ] ) )
                {
                    match = str.slice(pos).match(pattern);
                    if (!match || match.index > 0) return false;
                    if (false !== eat) 
                    {
                        ayto.pos += match[group||0].length;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return match;
                }
                return false;
            },

            // eat space
            spc: function( eat ) {
                var ayto = this, m, start = ayto.pos, s = ayto.s.slice(start);
                if ( m = s.match( spcRegex ) ) 
                {
                    if ( false !== eat )
                    {
                        ayto.pos += m[0].length;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return 1;
                }
                return 0;
            },
            
            // skip to end
            end: function( ) {
                var ayto = this;
                ayto.pos = ayto.s.length;
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },

            // get next char
            nxt: function( ) {
                var ayto = this, ch, s = ayto.s;
                if (ayto.pos < s.length)
                {
                    ch = s.charAt(ayto.pos++) || null;
                    if ( ayto._ ) ayto._.pos = ayto.pos;
                    return ch;
                }
            },
            
            // back-up n steps
            bck: function( n ) {
                var ayto = this;
                ayto.pos = Max(0, ayto.pos - n);
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },
            
            // back-track to pos
            bck2: function( pos ) {
                var ayto = this;
                ayto.pos = Max(0, pos);
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },
            
            // get current column including tabs
            col: function( tabSize ) {
                var ayto = this;
                tabSize = tabSize || 1;
                if (ayto.lCP < ayto.start) 
                {
                    ayto.lCV = countColumn(ayto.s, ayto.start, tabSize, ayto.lCP, ayto.lCV);
                    ayto.lCP = ayto.start;
                    if ( ayto._ )
                    {
                        ayto._.start = ayto.start;
                        ayto._.lastColumnPos = ayto.lCP;
                        ayto._.lastColumnValue = ayto.lCV;
                        ayto._.lineStart = ayto.lS;
                    }
                }
                return ayto.lCV - (ayto.lS ? countColumn(ayto.s, ayto.lS, tabSize) : 0);
            },
            
            // get current indentation including tabs
            ind: function( tabSize ) {
                var ayto = this;
                tabSize = tabSize || 1;
                return countColumn(ayto.s, null, tabSize) - (ayto.lS ? countColumn(ayto.s, ayto.lS, tabSize) : 0);
            },
            
            // current stream selection
            cur: function( andShiftStream ) {
                var ayto = this, ret = ayto.s.slice(ayto.start, ayto.pos);
                if ( andShiftStream ) ayto.start = ayto.pos;
                return ret;
            },
            
            // move/shift stream
            sft: function( ) {
                this.start = this.pos;
                return this;
            }
        })
    ;
        
    //
    // Stack Class
    var
        Stack = Class({
            
            constructor: function( array ) {
                this._ = array || [];
            },
            
            // abbreviations used for optimal minification
            _: null,
            
            toString: function( ) { 
                var a = this._.slice(); 
                return a.reverse().join("\n"); 
            },
            
            clone: function( ) {
                return new this.$class( this._.slice() );
            },
            
            isEmpty: function( ) {
                return 0 >= this._.length;
            },
            
            pos: function( ) {
                return this._.length;
            },
            
            peek: function( index ) {
                var stack = this._;
                index = ('undefined' == typeof(index)) ? -1 : index;
                if ( stack.length )
                {
                    if ( (0 > index) && (0 <= stack.length+index) )
                        return stack[ stack.length + index ];
                    else if ( 0 <= index && index < stack.length )
                        return stack[ index ];
                }
                return null;
            },
            
            pop: function( ) {
                return this._.pop();
            },
            
            shift: function( ) {
                return this._.shift();
            },
            
            push: function( i ) {
                this._.push(i);
                return this;
            },
            
            unshift: function( i ) {
                this._.unshift(i);
                return this;
            },
            
            pushAt: function( pos, token, idProp, id ) {
                var stack = this._;
                if ( idProp && id ) token[idProp] = id;
                if ( pos < stack.length ) stack.splice( pos, 0, token );
                else stack.push( token );
                return this;
            },
            
            empty: function(idProp, id) {
                var stack = this._, l = stack.length;
                if ( idProp && id )
                {
                    //while (l && stack[l-1] && stack[l-1][idProp] == id) 
                    while (stack.length && stack[stack.length-1] && stack[stack.length-1][idProp] == id) 
                    {
                        //console.log([id, stack[l-1][idProp]]);
                        //--l;
                        stack.pop();
                    }
                    //stack.length = l;
                }
                else stack.length = 0;
                return this;
            }
        })
    ;
        
    //
    // State Class
    var
        State = Class({
            
            constructor: function( line, unique ) {
                var ayto = this;
                // this enables unique state "names"
                // thus forces highlight to update
                // however updates also occur when no update necessary ??
                ayto.id = unique ? new Date().getTime() : 0;
                ayto.l = line || 0;
                ayto.stack = new Stack();
                ayto.data = new Stack();
                ayto.col = 0;
                ayto.indent = 0;
                ayto.t = null;
                ayto.inBlock = null;
                ayto.endBlock = null;
                ayto.parserState = "initial";
            },
            
            // state id
            id: 0,
            // state current line
            l: 0,
            col: 0,
            indent: 0,
            // state token stack
            stack: null,
            // state token push/pop match data
            data: null,
            // state current token
            t: null,
            // state current block name
            inBlock: null,
            // state endBlock for current block
            endBlock: null,
            // parser state
            parserState: null,
            
            clone: function( unique ) {
                var ayto = this, c = new ayto.$class( ayto.l, unique );
                c.t = ayto.t;
                c.col = ayto.col;
                c.indent = ayto.indent;
                c.stack = ayto.stack.clone();
                c.data = ayto.data.clone();
                c.inBlock = ayto.inBlock;
                c.endBlock = ayto.endBlock;
                c.parserState = ayto.parserState;
                return c;
            },
            
            // used mostly for ACE which treats states as strings, 
            // make sure to generate a string which will cover most cases where state needs to be updated by the editor
            toString: function() {
                var ayto = this;
                //return ['', ayto.id, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.r||'0', ayto.stack.length, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.stack.length, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.r||'0', ayto.inBlock||'0'].join('_');
                //return ['', ayto.l, ayto.t, ayto.r, ayto.inBlock||'0', ayto.stack.length].join('_');
                return ['', ayto.id, ayto.l, ayto.t, ayto.inBlock||'0'].join('_');
            }
        })
    ;
        
    //
    // matcher factories
    var 
        SimpleMatcher = Class({
            
            constructor : function(type, name, pattern, key) {
                var ayto = this;
                ayto.type = T_SIMPLEMATCHER;
                ayto.tt = type || T_CHAR;
                ayto.tn = name;
                ayto.tk = key || 0;
                ayto.tg = 0;
                ayto.tp = null;
                ayto.p = null;
                ayto.np = null;
                
                // get a fast customized matcher for < pattern >
                switch ( ayto.tt )
                {
                    case T_CHAR: case T_CHARLIST:
                        ayto.tp = pattern;
                        break;
                    case T_STR:
                        ayto.tp = pattern;
                        ayto.p = {};
                        ayto.p[ '' + pattern.charAt(0) ] = 1;
                        break;
                    case T_REGEX:
                        ayto.tp = pattern[ 0 ];
                        ayto.p = pattern[ 1 ].peek || null;
                        ayto.np = pattern[ 1 ].negativepeek || null;
                        ayto.tg = pattern[ 2 ] || 0;
                        break;
                    case T_NULL:
                        ayto.tp = null;
                        break;
                }
            },
            
            // matcher type
            type: null,
            // token type
            tt: null,
            // token name
            tn: null,
            // token pattern
            tp: null,
            // token pattern group
            tg: 0,
            // token key
            tk: 0,
            // pattern peek chars
            p: null,
            // pattern negative peek chars
            np: null,
            
            get : function(stream, eat) {
                var matchedResult, ayto = this,
                    tokenType = ayto.tt, tokenKey = ayto.tk, 
                    tokenPattern = ayto.tp, tokenPatternGroup = ayto.tg,
                    startsWith = ayto.p, notStartsWith = ayto.np
                ;    
                // get a fast customized matcher for < pattern >
                switch ( tokenType )
                {
                    case T_CHAR:
                        if ( matchedResult = stream.chr(tokenPattern, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_CHARLIST:
                        if ( matchedResult = stream.chl(tokenPattern, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_STR:
                        if ( matchedResult = stream.str(tokenPattern, startsWith, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_REGEX:
                        if ( matchedResult = stream.rex(tokenPattern, startsWith, notStartsWith, tokenPatternGroup, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_NULL:
                        // matches end-of-line
                        (false !== eat) && stream.end(); // skipToEnd
                        return [ tokenKey, "" ];
                        break;
                }
                return false;
            },
            
            toString : function() {
                return ['[', 'Matcher: ', this.tn, ', Pattern: ', ((this.tp) ? this.tp.toString() : null), ']'].join('');
            }
        }),
        
        CompositeMatcher = Class(SimpleMatcher, {
            
            constructor : function(name, matchers, useOwnKey) {
                var ayto = this;
                ayto.type = T_COMPOSITEMATCHER;
                ayto.tn = name;
                ayto.ms = matchers;
                ayto.ownKey = (false!==useOwnKey);
            },
            
            // group of matchers
            ms : null,
            ownKey : true,
            
            get : function(stream, eat) {
                var i, m, matchers = this.ms, l = matchers.length, useOwnKey = this.ownKey;
                for (i=0; i<l; i++)
                {
                    // each one is a matcher in its own
                    m = matchers[i].get(stream, eat);
                    if ( m ) return ( useOwnKey ) ? [ i, m[1] ] : m;
                }
                return false;
            }
        }),
        
        BlockMatcher = Class(SimpleMatcher, {
            
            constructor : function(name, start, end) {
                var ayto = this;
                ayto.type = T_BLOCKMATCHER;
                ayto.tn = name;
                ayto.s = new CompositeMatcher(ayto.tn + '_Start', start, false);
                ayto.e = end;
            },
            
            // start block matcher
            s : null,
            // end block matcher
            e : null,
            
            get : function(stream, eat) {
                    
                var ayto = this, startMatcher = ayto.s, endMatchers = ayto.e, token;
                
                // matches start of block using startMatcher
                // and returns the associated endBlock matcher
                if ( token = startMatcher.get(stream, eat) )
                {
                    // use the token key to get the associated endMatcher
                    var endMatcher = endMatchers[ token[0] ], m, 
                        T = get_type( endMatcher ), T0 = startMatcher.ms[ token[0] ].tt;
                    
                    if ( T_REGEX == T0 )
                    {
                        // regex group number given, get the matched group pattern for the ending of this block
                        if ( T_NUM == T )
                        {
                            // the regex is wrapped in an additional group, 
                            // add 1 to the requested regex group transparently
                            m = token[1][ endMatcher+1 ];
                            endMatcher = new SimpleMatcher( (m.length > 1) ? T_STR : T_CHAR, ayto.tn + '_End', m );
                        }
                        // string replacement pattern given, get the proper pattern for the ending of this block
                        else if ( T_STR == T )
                        {
                            // the regex is wrapped in an additional group, 
                            // add 1 to the requested regex group transparently
                            m = groupReplace(endMatcher, token[1]);
                            endMatcher = new SimpleMatcher( (m.length > 1) ? T_STR : T_CHAR, ayto.tn + '_End', m );
                        }
                    }
                    return endMatcher;
                }
                
                return false;
            }
        }),
        
        getSimpleMatcher = function(name, pattern, key, cachedMatchers) {
            var T = get_type( pattern );
            
            if ( T_NUM == T ) return pattern;
            
            if ( !cachedMatchers[ name ] )
            {
                key = key || 0;
                var matcher;
                var is_char_list = 0;
                
                if ( pattern && pattern.isCharList )
                {
                    is_char_list = 1;
                    delete pattern.isCharList;
                }
                
                // get a fast customized matcher for < pattern >
                if ( T_NULL & T ) matcher = new SimpleMatcher(T_NULL, name, pattern, key);
                
                else if ( T_CHAR == T ) matcher = new SimpleMatcher(T_CHAR, name, pattern, key);
                
                else if ( T_STR & T ) matcher = (is_char_list) ? new SimpleMatcher(T_CHARLIST, name, pattern, key) : new SimpleMatcher(T_STR, name, pattern, key);
                
                else if ( /*T_REGEX*/T_ARRAY & T ) matcher = new SimpleMatcher(T_REGEX, name, pattern, key);
                
                // unknown
                else matcher = pattern;
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getCompositeMatcher = function(name, tokens, RegExpID, combined, cachedRegexes, cachedMatchers) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, l2, array_of_arrays = 0, has_regexs = 0, is_char_list = 1, T1, T2;
                var matcher;
                
                tmp = make_array( tokens );
                l = tmp.length;
                
                if ( 1 == l )
                {
                    matcher = getSimpleMatcher( name, getRegexp( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
                }
                else if ( 1 < l /*combined*/ )
                {   
                    l2 = (l>>1) + 1;
                    // check if tokens can be combined in one regular expression
                    // if they do not contain sub-arrays or regular expressions
                    for (i=0; i<=l2; i++)
                    {
                        T1 = get_type( tmp[i] );
                        T2 = get_type( tmp[l-1-i] );
                        
                        if ( (T_CHAR != T1) || (T_CHAR != T2) ) 
                        {
                            is_char_list = 0;
                        }
                        
                        if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
                        {
                            array_of_arrays = 1;
                            //break;
                        }
                        else if ( hasPrefix( tmp[i], RegExpID ) || hasPrefix( tmp[l-1-i], RegExpID ) )
                        {
                            has_regexs = 1;
                            //break;
                        }
                    }
                    
                    if ( is_char_list && ( !combined || !( T_STR & get_type(combined) ) ) )
                    {
                        tmp = tmp.slice().join('');
                        tmp.isCharList = 1;
                        matcher = getSimpleMatcher( name, tmp, 0, cachedMatchers );
                    }
                    else if ( combined && !(array_of_arrays || has_regexs) )
                    {   
                        matcher = getSimpleMatcher( name, getCombinedRegexp( tmp, combined ), 0, cachedMatchers );
                    }
                    else
                    {
                        for (i=0; i<l; i++)
                        {
                            if ( T_ARRAY & get_type( tmp[i] ) )
                                tmp[i] = getCompositeMatcher( name + '_' + i, tmp[i], RegExpID, combined, cachedRegexes, cachedMatchers );
                            else
                                tmp[i] = getSimpleMatcher( name + '_' + i, getRegexp( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
                        }
                        
                        matcher = (l > 1) ? new CompositeMatcher( name, tmp ) : tmp[0];
                    }
                }
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getBlockMatcher = function(name, tokens, RegExpID, cachedRegexes, cachedMatchers) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, start, end, t1, t2;
                
                // build start/end mappings
                start = []; end = [];
                tmp = make_array_2( tokens ); // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getSimpleMatcher( name + '_0_' + i, getRegexp( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
                    if (tmp[i].length>1)
                    {
                        if ( T_REGEX == t1.tt && T_STR == get_type( tmp[i][1] ) && !hasPrefix( tmp[i][1], RegExpID ) )
                            t2 = tmp[i][1];
                        else
                            t2 = getSimpleMatcher( name + '_1_' + i, getRegexp( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
                    }
                    else
                    {
                        t2 = t1;
                    }
                    start.push( t1 );  end.push( t2 );
                }
                
                cachedMatchers[ name ] = new BlockMatcher(name, start, end);
            }
            
            return cachedMatchers[ name ];
        }
    ;
    
    //
    // tokenizer factories
    var
        SimpleToken = Class({
            
            constructor : function(type, name, token) {
                var ayto = this;
                ayto.tt = type || T_SIMPLE;
                ayto.id = name;
                ayto.tk = token;
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                ayto.CLONE = ['tk'];
            },
            
            sID: null,
            // tokenizer/token name/id
            id: null,
            // tokenizer type
            tt: null,
            // tokenizer token matcher
            tk: null,
            // tokenizer match action (optional)
            tm: null,
            //tokenizer match state action (optional)
            tms: null,

            REQ: 0,
            ERR: 0,
            MTCH: 0,
            STATEMATCH: 0,
            CLONE: null,
            
            // tokenizer match action (optional)
            m : function(token, state) {
                var matchAction = this.tm || null, t, T, data = state.data;
                
                if ( matchAction )
                {
                    t = matchAction[1];
                    
                    if ( "push" == matchAction[0] && t )
                    {
                        if ( token )
                        {
                            T = get_type( t );
                            if ( T_NUM == T )  t = token[1][t];
                            else t = groupReplace(t, token[1]);
                        }
                        data.push( t );
                    }
                    
                    else if ( "pop" ==  matchAction[0] )
                    {
                        if ( t )
                        {
                            if ( token )
                            {
                                T = get_type( t );
                                if ( T_NUM == T )  t = token[1][t];
                                else t = groupReplace(t, token[1]);
                            }
                            
                            if ( data.isEmpty() || t != data.peek() ) return t;
                            data.pop();
                        }
                        else if ( data.length ) data.pop();
                    }
                }
                return 0;
            },

            matchState: function(state){
                var matchStateAction = this.tms;

                if(matchStateAction){
                    var newState = matchStateAction[state.parserState];
                    if (newState === undefined){
                        return -1;
                    }

                    state.parserState = newState;
                }

                return 0;
            },
            
            get : function( stream, state ) {
                var ayto = this, matchAction = ayto.tm, token = ayto.tk, 
                    type = ayto.tt, tokenID = ayto.id, t = null;
                var matchStateAction = ayto.tms;
                
                ayto.MTCH = 0;
                // match EMPTY token
                if ( T_EMPTY == type ) 
                { 
                    ayto.ERR = 0;
                    ayto.REQ = 0;
                    return true;
                }
                // match EOL ( with possible leading spaces )
                else if ( T_EOL == type ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        return tokenID; 
                    }
                }
                // match non-space
                else if ( T_NONSPACE == type ) 
                { 
                    ayto.ERR = ( ayto.REQ && stream.spc() && !stream.eol() ) ? 1 : 0;
                    ayto.REQ = 0;
                }
                // else match a simple token
                else if ( t = token.get(stream) ) 
                { 
                    if ( matchAction ) ayto.MTCH = ayto.m(t, state);
                    if ( matchStateAction ) ayto.STATEMATCH = ayto.matchState(state);
                    return tokenID; 
                }
                return false;
            },
            
            req : function(bool) { 
                this.REQ = (bool) ? 1 : 0;
                return this;
            },
            
            err : function() {
                var t = this;
                if ( t.REQ ) return ('Token "'+t.id+'" Expected');
                else if ( t.STATEMATCH ) return ('Unexpected '+ t.id);
                else if ( t.MTCH ) return ('Token "'+t.MTCH+'" No Match');
                return ('Syntax Error: "'+t.id+'"');
            },
        
            clone : function() {
                var ayto = this, t, i, toClone = ayto.CLONE, toClonelen;
                
                t = new ayto.$class();
                t.tt = ayto.tt;
                t.id = ayto.id;
                t.tm = (ayto.tm) ? ayto.tm.slice() : ayto.tm;
                
                if (toClone && toClone.length)
                {
                    for (i=0, toClonelen = toClone.length; i<toClonelen; i++)   
                        t[ toClone[i] ] = ayto[ toClone[i] ];
                }
                return t;
            },
            
            toString : function() {
                return ['[', 'Tokenizer: ', this.id, ', Matcher: ', ((this.tk) ? this.tk.toString() : null), ']'].join('');
            }
        }),
        
        BlockToken = Class(SimpleToken, {
            
            constructor : function(type, name, token, allowMultiline, escChar, hasInterior) {
                var ayto = this;
                ayto.$superv('constructor', [type, name, token]);
                // a block is multiline by default
                ayto.mline = ( 'undefined' == typeof(allowMultiline) ) ? 1 : allowMultiline;
                ayto.esc = escChar || "\\";
                ayto.inter = hasInterior;
                ayto.CLONE = ['tk', 'mline', 'esc', 'inter'];
            },    
            
            inter: 0,
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ayto = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
                    allowMultiline = ayto.mline, startBlock = ayto.tk, thisBlock = ayto.id, type = ayto.tt,
                    hasInterior = ayto.inter, thisBlockInterior = (hasInterior) ? (thisBlock+'.inside') : thisBlock,
                    charIsEscaped = 0, isEscapedBlock = (T_ESCBLOCK == type), escChar = ayto.esc,
                    isEOLBlock, alreadyIn, ret, streamPos, streamPos0, continueBlock
                ;

                ayto.STATEMATCH = 0;

                /*
                    This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
                    having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
                    So logic can become somewhat complex,
                    descriptive names and logic used here for clarity as far as possible
                */
                
                // comments in general are not required tokens
                if ( T_COMMENT == type ) ayto.REQ = 0;
                
                alreadyIn = 0;
                if ( state.inBlock == thisBlock )
                {
                    found = 1;
                    endBlock = state.endBlock;
                    alreadyIn = 1;
                    ret = thisBlockInterior;
                }    
                else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
                {
                    found = 1;
                    state.inBlock = thisBlock;
                    state.endBlock = endBlock;
                    ret = thisBlock;
                }    
                
                if ( found )
                {
                    stackPos = state.stack.pos();
                    
                    isEOLBlock = (T_NULL == endBlock.tt);
                    
                    if ( hasInterior )
                    {
                        if ( alreadyIn && isEOLBlock && stream.sol() )
                        {
                            ayto.REQ = 0;
                            state.inBlock = null;
                            state.endBlock = null;
                            return false;
                        }
                        
                        if ( !alreadyIn )
                        {
                            state.stack.pushAt( stackPos, ayto.clone(), 'sID', thisBlock );
                            return ret;
                        }
                    }
                    
                    ended = endBlock.get(stream);
                    continueToNextLine = allowMultiline;
                    continueBlock = 0;
                    
                    if ( !ended )
                    {
                        streamPos0 = stream.pos;
                        while ( !stream.eol() ) 
                        {
                            streamPos = stream.pos;
                            if ( !(isEscapedBlock && charIsEscaped) && endBlock.get(stream) ) 
                            {
                                if ( hasInterior )
                                {
                                    if ( stream.pos > streamPos && streamPos > streamPos0 )
                                    {
                                        ret = thisBlockInterior;
                                        stream.bck2(streamPos);
                                        continueBlock = 1;
                                    }
                                    else
                                    {
                                        ret = thisBlock;
                                        ended = 1;
                                    }
                                }
                                else
                                {
                                    ret = thisBlock;
                                    ended = 1;
                                }
                                break;
                            }
                            else
                            {
                                next = stream.nxt();
                            }
                            charIsEscaped = !charIsEscaped && next == escChar;
                        }
                    }
                    else
                    {
                        ret = (isEOLBlock) ? thisBlockInterior : thisBlock;
                    }
                    continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
                    
                    if ( ended || (!continueToNextLine && !continueBlock) )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        state.stack.pushAt( stackPos, ayto.clone(), 'sID', thisBlock );
                    }
                    
                    return ret;
                }

                ayto.STATEMATCH = ayto.matchState(state);
                //state.inBlock = null;
                //state.endBlock = null;
                return false;
            }
        }),
                
        RepeatedTokens = Class(SimpleToken, {
                
            constructor : function( type, name, tokens, min, max ) {
                var ayto = this;
                ayto.tt = type || T_REPEATED;
                ayto.id = name || null;
                ayto.tk = null;
                ayto.ts = null;
                ayto.min = min || 0;
                ayto.max = max || INF;
                ayto.found = 0;
                ayto.CLONE = ['ts', 'min', 'max', 'found'];
                if (tokens) ayto.set( tokens );
            },
            
            ts: null,
            min: 0,
            max: 1,
            found : 0,
            
            set : function( tokens ) {
                if ( tokens ) this.ts = make_array( tokens );
                return this;
            },
            
            get : function( stream, state ) {
            
                var ayto = this, i, token, style, tokens = ayto.ts, n = tokens.length, 
                    found = ayto.found, min = ayto.min, max = ayto.max,
                    tokensRequired = 0, streamPos, stackPos, stackId;
                
                ayto.ERR = 0;
                ayto.REQ = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.pos();
                stackId = ayto.id+'_'+getId();
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().req( 1 );
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        ++found;
                        if ( found <= max )
                        {
                            // push it to the stack for more
                            ayto.found = found;
                            state.stack.pushAt( stackPos, ayto.clone(), 'sID', stackId );
                            ayto.found = 0;
                            ayto.MTCH = token.MTCH;
                            return style;
                        }
                        break;
                    }
                    else if ( token.REQ )
                    {
                        tokensRequired++;
                    }
                    if ( token.ERR ) stream.bck2( streamPos );
                }
                
                ayto.REQ = found < min;
                ayto.ERR = found > max || (found < min && 0 < tokensRequired);
                return false;
            }
        }),
        
        EitherTokens = Class(RepeatedTokens, {
                
            constructor : function( type, name, tokens ) {
                this.$superv('constructor', [type, name, tokens, 1, 1]);
            },
            
            get : function( stream, state ) {
            
                var ayto = this, style, token, i, tokens = ayto.ts, n = tokens.length, 
                    tokensRequired = 0, tokensErr = 0, streamPos;
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().req( 1 );
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.REQ) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        ayto.MTCH = token.MTCH;
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( streamPos );
                    }
                }
                
                ayto.REQ = (tokensRequired > 0);
                ayto.ERR = (n == tokensErr && tokensRequired > 0);
                return false;
            }
        }),

        AllTokens = Class(RepeatedTokens, {
                
            constructor : function( type, name, tokens ) {
                this.$superv('constructor', [type, name, tokens, 1, 1]);
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length,
                    streamPos, stackPos, stackId;
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                ayto.STATEMATCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.pos();
                token = tokens[ 0 ].clone().req( 1 );
                style = token.get(stream, state);
                stackId = ayto.id+'_'+getId();
                
                if ( false !== style )
                {
                    // not empty token
                    if ( true !== style )
                    {
                        for (var i=n-1; i>0; i--)
                            state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
                    }
                        
                    ayto.MTCH = token.MTCH;
                    ayto.STATEMATCH = ayto.matchState(token, state);
                    return style;
                }
                else if ( token.ERR || ayto.STATEMATCH /*&& token.REQ*/ )
                {
                    ayto.ERR = 1;
                    stream.bck2( streamPos );
                }
                else if ( token.REQ )
                {
                    ayto.ERR = 1;
                }

                return false;
            }
        }),
                
        NGramToken = Class(RepeatedTokens, {
                
            constructor : function( type, name, tokens ) {
                this.$superv('constructor', [type, name, tokens, 1, 1]);
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length, 
                    streamPos, stackPos, stackId, i;
                
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.pos();
                token = tokens[ 0 ].clone().req( 0 );
                style = token.get(stream, state);
                stackId = ayto.id+'_'+getId();
                
                if ( false !== style )
                {
                    // not empty token
                    if ( true !== style )
                    {
                        for (i=n-1; i>0; i--)
                            state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
                    }
                    
                    ayto.MTCH = token.MTCH;
                    ayto.STATEMATCH = ayto.matchState(state);
                    return style;
                }
                else if ( token.ERR )
                {
                    stream.bck2( streamPos );
                }
                
                return false;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords) {
            
            var tok, token = null, type, combine, matchAction, matchType, tokens, subTokenizers,
                ngrams, ngram, i, l, j, l2;
            var matchStateAction;
            
            if ( null === tokenID )
            {
                // EOL Tokenizer
                return new SimpleToken( T_EOL, 'EOL', tokenID );
            }
            
            else if ( "" === tokenID )
            {
                // NONSPACE Tokenizer
                return new SimpleToken( T_NONSPACE, 'NONSPACE', tokenID );
            }
            
            else if ( false === tokenID || 0 === tokenID )
            {
                // EMPTY Tokenizer
                return new SimpleToken( T_EMPTY, 'EMPTY', tokenID );
            }
            
            else
            {
                tokenID = '' + tokenID;
                
                if ( !cachedTokens[ tokenID ] )
                {
                    // allow token to be literal and wrap to simple token with default style
                    tok = Lex[ tokenID ] || Syntax[ tokenID ] || { type: "simple", tokens: tokenID };
                    
                    if ( tok )
                    {
                        // tokens given directly, no token configuration object, wrap it
                        if ( (T_STR | T_ARRAY) & get_type( tok ) )
                        {
                            tok = { type: "simple", tokens: tok };
                        }
                        
                        // allow tokens to extend / reference other tokens
                        while ( tok['extend'] )
                        {
                            var xtends = tok['extend'], xtendedTok = Lex[xtends] || Syntax[xtends];
                            delete tok['extend'];
                            if ( xtendedTok ) 
                            {
                                // tokens given directly, no token configuration object, wrap it
                                if ( (T_STR | T_ARRAY) & get_type( xtendedTok ) )
                                {
                                    xtendedTok = { type: "simple", tokens: xtendedTok };
                                }
                                tok = extend(xtendedTok, tok);
                            }
                            // xtendedTok may in itself extebnd another tok and so on,
                            // loop and get all references
                        }
                        
                        // provide some defaults
                        type = (tok.type) ? tokenTypes[ tok.type.toUpperCase().replace('-', '').replace('_', '') ] : T_SIMPLE;
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( "" === tok.tokens )
                            {
                                // NONSPACE Tokenizer
                                token = new SimpleToken( T_NONSPACE, tokenID, tokenID );
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                            else if ( null === tok.tokens )
                            {
                                // EOL Tokenizer
                                token = new SimpleToken( T_EOL, tokenID, tokenID );
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                            else if ( false === tok.tokens || 0 === tok.tokens )
                            {
                                // EMPTY Tokenizer
                                token = new SimpleToken( T_EMPTY, tokenID, tokenID );
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                        }
            
                        tok.tokens = make_array( tok.tokens );
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( tok.autocomplete ) getAutoComplete(tok, tokenID, keywords);
                            
                            matchAction = null;
                            if ( tok.push )
                            {
                                matchAction = [ "push", tok.push ];
                            }
                            else if  ( 'undefined' != typeof(tok.pop) )
                            {
                                matchAction = [ "pop", tok.pop ];
                            }

                            matchStateAction = null;

                            if(tok.state){
                                matchStateAction = tok.state;
                            }
                            
                            // combine by default if possible using word-boundary delimiter
                            combine = ( 'undefined' ==  typeof(tok.combine) ) ? "\\b" : tok.combine;
                            token = new SimpleToken( T_SIMPLE, tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers )
                                    );
                            
                            token.tm = matchAction;
                            token.tms = matchStateAction;
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                        }
                        
                        else if ( T_BLOCK & type )
                        {
                            if ( T_COMMENT & type ) getComments(tok, comments);

                            matchStateAction = null;

                            if(tok.state){
                                matchStateAction = tok.state;
                            }

                            token = new BlockToken( type, tokenID,
                                        getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                                        tok.multiline,
                                        tok.escape,
                                        // allow block delims / block interior to have different styles
                                        Style[ tokenID + '.inside' ] ? 1 : 0
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            if ( tok.interleave ) commentTokens.push( token.clone() );

                            token.tms = matchStateAction;
                        }
                        
                        else if ( T_GROUP & type )
                        {
                            matchStateAction = null;

                            if(tok.state){
                                matchStateAction = tok.state;
                            }

                            tokens = tok.tokens.slice();
                            if ( T_ARRAY & get_type( tok.match ) )
                            {
                                token = new RepeatedTokens(T_REPEATED, tokenID, null, tok.match[0], tok.match[1]);
                            }
                            else
                            {
                                matchType = groupTypes[ tok.match.toUpperCase() ]; 
                                
                                if (T_ZEROORONE == matchType) 
                                    token = new RepeatedTokens(T_ZEROORONE, tokenID, null, 0, 1);
                                
                                else if (T_ZEROORMORE == matchType) 
                                    token = new RepeatedTokens(T_ZEROORMORE, tokenID, null, 0, INF);
                                
                                else if (T_ONEORMORE == matchType) 
                                    token = new RepeatedTokens(T_ONEORMORE, tokenID, null, 1, INF);
                                
                                else if (T_EITHER & matchType) 
                                    token = new EitherTokens(T_EITHER, tokenID, null);
                                
                                else //if (T_ALL == matchType)
                                    token = new AllTokens(T_ALL, tokenID, null);

                                token.tm = matchAction;
                                token.tms = matchStateAction;
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            subTokenizers = [];
                            for (i=0, l=tokens.length; i<l; i++)
                                subTokenizers = subTokenizers.concat( getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) );
                            
                            token.set( subTokenizers );
                            
                        }
                        
                        else if ( T_NGRAM & type )
                        {
                            matchStateAction = null;

                            if(tok.state){
                                matchStateAction = tok.state;
                            }

                            // get n-gram tokenizer
                            token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                            ngrams = [];
                            
                            for (i=0, l=token.length; i<l; i++)
                            {
                                // get tokenizers for each ngram part
                                ngrams[i] = token[i].slice();
                                // get tokenizer for whole ngram
                                token[i] = new NGramToken( T_NGRAM, tokenID + '_NGRAM_' + i, null );
                            }

                            token[token.length-1].tms = matchStateAction;

                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (i=0, l=token.length; i<l; i++)
                            {
                                ngram = ngrams[i];
                                
                                subTokenizers = [];
                                for (j=0, l2=ngram.length; j<l2; j++)
                                    subTokenizers = subTokenizers.concat( getTokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens,  comments, keywords ) );
                                
                                // get tokenizer for whole ngram
                                token[i].set( subTokenizers );
                            }

                        }
                    }
                }
                return cachedTokens[ tokenID ];
            }
        },
        
        getComments = function(tok, comments) {
            // build start/end mappings
            var tmp = make_array_2(tok.tokens.slice()); // array of arrays
            var start, end, lead;
            for (i=0, l=tmp.length; i<l; i++)
            {
                start = tmp[i][0];
                end = (tmp[i].length>1) ? tmp[i][1] : tmp[i][0];
                lead = (tmp[i].length>2) ? tmp[i][2] : "";
                
                if ( null === end )
                {
                    // line comment
                    comments.line = comments.line || [];
                    comments.line.push( start );
                }
                else
                {
                    // block comment
                    comments.block = comments.block || [];
                    comments.block.push( [start, end, lead] );
                }
            }
        },
        
        getAutoComplete = function(tok, type, keywords) {
            var kws = [].concat(make_array(tok.tokens)).map(function(word) { return { word: word, meta: type }; });
            keywords.autocomplete = concat.apply( keywords.autocomplete || [], kws );
        },
        
        parseGrammar = function(grammar) {
            var RegExpID, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed ) return grammar;
            
            cachedRegexes = {}; cachedMatchers = {}; cachedTokens = {}; comments = {}; keywords = {};
            commentTokens = [];
            grammar = clone( grammar );
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            Lex = grammar.Lex || {};
            grammar.Lex = null;
            delete grammar.Lex;
            
            Syntax = grammar.Syntax || {};
            grammar.Syntax = null;
            delete grammar.Syntax;
            
            Style = grammar.Style || {};
            
            _tokens = grammar.Parser || [];
            numTokens = _tokens.length;
            tokens = [];
            
            
            // build tokens
            for (t=0; t<numTokens; t++)
            {
                tokenID = _tokens[ t ];
                
                token = getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY & get_type( token ) )  tokens = tokens.concat( token );
                    
                    else  tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.cTokens = commentTokens;
            grammar.Style = Style;
            grammar.Comments = comments;
            grammar.Keywords = keywords;
            grammar.Extra = grammar.Extra || {};
            
            // this grammar is parsed
            grammar.__parsed = 1;
            
            return grammar;
        }
    ;
      
    // ace supposed to be available
    var _ace = (typeof ace !== 'undefined') ? ace : { require: function() { return { }; }, config: {} }, 
        ace_require = _ace.require, ace_config = _ace.config
    ;
    
    //
    // parser factories
    var
        AceWorkerClient = Class(ace_require("ace/worker/worker_client").WorkerClient, {
            constructor: function(topLevelNamespaces, mod, classname) {
                var ayto = this, require = ace_require, config = ace_config;
                ayto.$sendDeltaQueue = ayto.$sendDeltaQueue.bind(ayto);
                ayto.changeListener = ayto.changeListener.bind(ayto);
                ayto.onMessage = ayto.onMessage.bind(ayto);
                if (require.nameToUrl && !require.toUrl)
                    require.toUrl = require.nameToUrl;

                var workerUrl;
                if (config.get("packaged") || !require.toUrl) {
                    workerUrl = config.moduleUrl(mod, "worker");
                } else {
                    var normalizePath = ayto.$normalizePath;
                    workerUrl = normalizePath(require.toUrl("ace/worker/worker.js", null, "_"));

                    var tlns = {};
                    topLevelNamespaces.forEach(function(ns) {
                        tlns[ns] = normalizePath(require.toUrl(ns, null, "_").replace(/(\.js)?(\?.*)?$/, ""));
                    });
                }
                
                ayto.$worker = new Worker(workerUrl);
                
                ayto.$worker.postMessage({
                    load: true,
                    ace_worker_base: thisPath.base + '/' + ace_config.moduleUrl("ace/worker/json")
                });

                ayto.$worker.postMessage({
                    init : true,
                    tlns: tlns,
                    module: mod,
                    classname: classname
                });

                ayto.callbackId = 1;
                ayto.callbacks = {};

                ayto.$worker.onmessage = ayto.onMessage;
            }
        }),
        
        Parser = Class(ace_require('ace/tokenizer').Tokenizer, {
            
            constructor: function(grammar, LOC) {
                var ayto = this, rxLine;
                // support comments toggle
                ayto.LC = grammar.Comments.line || null;
                ayto.BC = (grammar.Comments.block) ? { start: grammar.Comments.block[0][0], end: grammar.Comments.block[0][1] } : null;
                if ( ayto.LC )
                {
                    if ( T_ARRAY & get_type(ayto.LC) ) 
                        rxLine = ayto.LC.map( escRegexp ).join( "|" );
                    
                    else 
                        rxLine = escRegexp( ayto.LC );
                    
                    ayto.rxLine = new RegExp("^(\\s*)(?:" + rxLine + ") ?");
                }
                if ( ayto.BC )
                {
                    ayto.rxStart = new RegExp("^(\\s*)(?:" + escRegexp(ayto.BC.start) + ")");
                    ayto.rxEnd = new RegExp("(?:" + escRegexp(ayto.BC.end) + ")\\s*$");
                }

                ayto.DEF = LOC.DEFAULT;
                ayto.ERR = grammar.Style.error || LOC.ERROR;
                
                // support keyword autocompletion
                ayto.Keywords = grammar.Keywords.autocomplete || null;
                
                ayto.Tokens = grammar.Parser || [];
                ayto.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
                ayto.Style = grammar.Style;
            },
            
            ERR: null,
            DEF: null,
            LC: null,
            BC: null,
            rxLine: null,
            rxStart: null,
            rxEnd: null,
            Keywords: null,
            cTokens: null,
            Tokens: null,
            Style: null,

            parse: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i, tokens = [], data;
                data = { state: new State( ), tokens: null };
                
                for (i=0; i<l; i++) {
                    data = this.getLineTokens(lines[i], data.state, i);
                    tokens.push(data.tokens);
                }
                return tokens;
            },
            
            // ACE Tokenizer compatible
            getLineTokens: function(line, state, row) {
                
                var ayto = this, i, rewind, rewind2, ci,
                    tokenizer, interleavedCommentTokens = ayto.cTokens, tokens = ayto.Tokens, numTokens = tokens.length, 
                    aceTokens, token, type, style, currentError = null,
                    stream, stack, DEFAULT = ayto.DEF, ERROR = ayto.ERR, Style = ayto.Style
                ;
                
                aceTokens = []; 
                stream = new Stream( line );
                state = (state) ? state.clone( 1 ) : new State( 1, 1 );
                state.l = 1+row;
                stack = state.stack;
                token = { type: null, value: "", error: null };
                type = null;
                style = null;
                
                // if EOL tokenizer is left on stack, pop it now
                if ( !stack.isEmpty() && T_EOL == stack.peek().tt && stream.sol() ) 
                {
                    stack.pop();
                }
                
                while ( !stream.eol() )
                {
                    rewind = 0;
                    
                    if ( style && style !== token.type )
                    {
                        if ( token.type ) aceTokens.push( token );
                        token = { type: style, value: stream.cur(1), error: currentError };
                        currentError = null;
                    }
                    else if ( token.type )
                    {
                        token.value += stream.cur(1);
                    }
                    style = false;
                    
                    // check for non-space tokenizer before parsing space
                    if ( (stack.isEmpty() || (T_NONSPACE != stack.peek().tt)) && stream.spc() )
                    {
                        state.t = type = DEFAULT;
                        style = DEFAULT;
                        continue;
                    }
                    
                    while ( !stack.isEmpty() && !stream.eol() )
                    {
                        if ( interleavedCommentTokens )
                        {
                            ci = 0; rewind2 = 0;
                            while ( ci < interleavedCommentTokens.length )
                            {
                                tokenizer = interleavedCommentTokens[ci++];
                                state.t = type = tokenizer.get(stream, state);
                                if ( false !== type )
                                {
                                    style = Style[type] || DEFAULT;
                                    rewind2 = 1;
                                    break;
                                }
                            }
                            if ( rewind2 )
                            {
                                rewind = 1;
                                break;
                            }
                        }
                    
                        tokenizer = stack.pop();
                        state.t = type = tokenizer.get(stream, state);
                    
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERR || tokenizer.REQ)
                            {
                                // empty the stack
                                stack.empty('sID', tokenizer.sID);
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = type = ERROR;
                                style = ERROR;
                                currentError = tokenizer.err();
                                rewind = 1;
                                break;
                            }
                            // optional
                            else
                            {
                                style = false;
                                continue;
                            }
                        }
                        // found token (not empty)
                        else if ( true !== type )
                        {
                            style = Style[type] || DEFAULT;
                            // match action error
                            if ( tokenizer.MTCH || tokenizer.STATEMATCH)
                            {
                                // empty the stack
                                stack.empty('sID', tokenizer.sID);
                                // generate error
                                state.t = type = ERROR;
                                style = ERROR;
                                currentError = tokenizer.err();
                            }
                            rewind = 1;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    for (i=0; i<numTokens; i++)
                    {
                        tokenizer = tokens[i];
                        state.t = type = tokenizer.get(stream, state);
                        
                        // match failed
                        if ( false === type )
                        {
                            // error
                            if ( tokenizer.ERR || tokenizer.REQ)
                            {
                                // empty the stack
                                stack.empty('sID', tokenizer.sID);
                                // skip this character
                                stream.nxt();
                                // generate error
                                state.t = type = ERROR;
                                style = ERROR;
                                currentError = tokenizer.err();
                                rewind = 1;
                                break;
                            }
                            // optional
                            else
                            {
                                style = false;
                                continue;
                            }
                        }
                        // found token (not empty)
                        else if ( true !== type )
                        {
                            style = Style[type] || DEFAULT;
                            // match action error
                            if ( tokenizer.MTCH  || tokenizer.STATEMATCH)
                            {
                                // empty the stack
                                stack.empty('sID', tokenizer.sID);
                                // generate error
                                state.t = type = ERROR;
                                style = ERROR;
                                currentError = tokenizer.err();
                            }
                            rewind = 1;
                            break;
                        }
                    }
                    
                    if ( rewind ) continue;
                    if ( stream.eol() ) break;
                    
                    // unknown, bypass
                    stream.nxt();
                    state.t = type = DEFAULT;
                    style = DEFAULT;
                }
                
                if ( style && style !== token.type )
                {
                    if ( token.type ) aceTokens.push( token );
                    aceTokens.push( { type: style, value: stream.cur(1), error: currentError } );
                    currentError = null;
                }
                else if ( token.type )
                {
                    token.value += stream.cur(1);
                    aceTokens.push( token );
                }
                token = null;
                
                //console.log(aceTokens);
                
                // ACE Tokenizer compatible
                return { state: state, tokens: aceTokens };
            },
            
            tCL : function(state, session, startRow, endRow) {
                var ayto = this,
                    doc = session.doc,
                    ignoreBlankLines = true,
                    shouldRemove = true,
                    minIndent = Infinity,
                    tabSize = session.getTabSize(),
                    insertAtTabStop = false,
                    comment, uncomment, testRemove, shouldInsertSpace
                ;
                
                if ( !ayto.LC ) 
                {
                    if ( !ayto.BC ) return false;
                    
                    var lineCommentStart = ayto.BC.start,
                        lineCommentEnd = ayto.BC.end,
                        regexpStart = ayto.rxStart,
                        regexpEnd = ayto.rxEnd
                    ;

                    comment = function(line, i) {
                        if (testRemove(line, i)) return;
                        if (!ignoreBlankLines || /\S/.test(line)) 
                        {
                            doc.insertInLine({row: i, column: line.length}, lineCommentEnd);
                            doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                        }
                    };

                    uncomment = function(line, i) {
                        var m;
                        if (m = line.match(regexpEnd))
                            doc.removeInLine(i, line.length - m[0].length, line.length);
                        if (m = line.match(regexpStart))
                            doc.removeInLine(i, m[1].length, m[0].length);
                    };

                    testRemove = function(line, row) {
                        if (regexpStart.test(line)) return true;
                        var tokens = session.getTokens(row);
                        for (var i = 0; i < tokens.length; i++) 
                        {
                            if (tokens[i].type === 'comment') return true;
                        }
                    };
                } 
                else 
                {
                    var lineCommentStart = (T_ARRAY == get_type(ayto.LC)) ? ayto.LC[0] : ayto.LC,
                        regexpLine = ayto.rxLine,
                        commentWithSpace = lineCommentStart + " ",
                        minEmptyLength
                    ;
                    
                    insertAtTabStop = session.getUseSoftTabs();

                    uncomment = function(line, i) {
                        var m = line.match(regexpLine), start, end;
                        if (!m) return;
                        start = m[1].length; end = m[0].length;
                        if (!shouldInsertSpace(line, start, end) && m[0][end - 1] == " ")  end--;
                        doc.removeInLine(i, start, end);
                    };
                    
                    comment = function(line, i) {
                        if (!ignoreBlankLines || /\S/.test(line)) 
                        {
                            if (shouldInsertSpace(line, minIndent, minIndent))
                                doc.insertInLine({row: i, column: minIndent}, commentWithSpace);
                            else
                                doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                        }
                    };
                    
                    testRemove = function(line, i) {
                        return regexpLine.test(line);
                    };

                    shouldInsertSpace = function(line, before, after) {
                        var spaces = 0;
                        while (before-- && line.charAt(before) == " ") spaces++;
                        if (spaces % tabSize != 0) return false;
                        spaces = 0;
                        while (line.charAt(after++) == " ") spaces++;
                        if (tabSize > 2)  return spaces % tabSize != tabSize - 1;
                        else  return spaces % tabSize == 0;
                        return true;
                    };
                }

                function iterate( applyMethod ) { for (var i=startRow; i<=endRow; i++) applyMethod(doc.getLine(i), i); }


                minEmptyLength = Infinity;
                
                iterate(function(line, i) {
                    var indent = line.search(/\S/);
                    if (indent !== -1) 
                    {
                        if (indent < minIndent)  minIndent = indent;
                        if (shouldRemove && !testRemove(line, i)) shouldRemove = false;
                    } 
                    else if (minEmptyLength > line.length)
                    {
                        minEmptyLength = line.length;
                    }
                });

                if (Infinity == minIndent) 
                {
                    minIndent = minEmptyLength;
                    ignoreBlankLines = false;
                    shouldRemove = false;
                }

                if (insertAtTabStop && minIndent % tabSize != 0)
                    minIndent = Math.floor(minIndent / tabSize) * tabSize;

                iterate(shouldRemove ? uncomment : comment);
            },

            tBC : function(state, session, range, cursor) {
                var ayto = this, 
                    TokenIterator = ace_require('ace/token_iterator').TokenIterator,
                    Range = ace_require('ace/range').Range,
                    comment = ayto.BC, iterator, token, sel,
                    initialRange, startRow, colDiff,
                    startRange, endRange, i, row, column
                ;
                if (!comment) return;

                iterator = new TokenIterator(session, cursor.row, cursor.column);
                token = iterator.getCurrentToken();

                sel = session.selection;
                initialRange = sel.toOrientedRange();

                if (token && /comment/.test(token.type)) 
                {
                    while (token && /comment/.test(token.type)) 
                    {
                        i = token.value.indexOf(comment.start);
                        if (i != -1) 
                        {
                            row = iterator.getCurrentTokenRow();
                            column = iterator.getCurrentTokenColumn() + i;
                            startRange = new Range(row, column, row, column + comment.start.length);
                            break;
                        }
                        token = iterator.stepBackward();
                    };

                    iterator = new TokenIterator(session, cursor.row, cursor.column);
                    token = iterator.getCurrentToken();
                    while (token && /comment/.test(token.type)) 
                    {
                        i = token.value.indexOf(comment.end);
                        if (i != -1) 
                        {
                            row = iterator.getCurrentTokenRow();
                            column = iterator.getCurrentTokenColumn() + i;
                            endRange = new Range(row, column, row, column + comment.end.length);
                            break;
                        }
                        token = iterator.stepForward();
                    }
                    if (endRange)
                        session.remove(endRange);
                    if (startRange) 
                    {
                        session.remove(startRange);
                        startRow = startRange.start.row;
                        colDiff = -comment.start.length;
                    }
                } 
                else 
                {
                    colDiff = comment.start.length;
                    startRow = range.start.row;
                    session.insert(range.end, comment.end);
                    session.insert(range.start, comment.start);
                }
                if (initialRange.start.row == startRow)
                    initialRange.start.column += colDiff;
                if (initialRange.end.row == startRow)
                    initialRange.end.column += colDiff;
                session.selection.fromOrientedRange(initialRange);
            },
            
            // Default indentation, TODO
            indent : function(line) { return line.match(/^\s*/)[0]; },
            
            getNextLineIndent : function(state, line, tab) { return line.match(/^\s*/)[0]; }
        }),
        
        getAceMode = function(parser, grammar) {
            
            var mode;
            
            // ACE-compatible Mode
            return mode = {
                /*
                // Maybe needed in later versions..
                
                createModeDelegates: function (mapping) { },

                $delegator: function(method, args, defaultHandler) { },
                */
                
                // the custom Parser/Tokenizer
                getTokenizer: function() { return parser; },
                
                supportGrammarAnnotations: 0,
                
                //HighlightRules: null,
                //$behaviour: parser.$behaviour || null,

                createWorker: function(session) {
                    
                    if ( !mode.supportGrammarAnnotations ) return null;
                    
                    // add this worker as an ace custom module
                    ace_config.setModuleUrl("ace/grammar_worker", thisPath.file);
                    
                    var worker = new AceWorkerClient(['ace'], "ace/grammar_worker", 'AceGrammarWorker');
                    
                    worker.attachToDocument(session.getDocument());
                    
                    // create a worker for this grammar
                    worker.call('Init', [grammar], function(){
                        //console.log('Init returned');
                        // hook worker to enable error annotations
                        worker.on("error", function(e) {
                            //console.log(e.data);
                            session.setAnnotations(e.data);
                        });

                        worker.on("ok", function() {
                            session.clearAnnotations();
                        });
                    });
                    
                    return worker;
                    
                },
                
                transformAction: function(state, action, editor, session, param) { },
                
                //lineCommentStart: parser.LC,
                //blockComment: parser.BC,
                toggleCommentLines: function(state, session, startRow, endRow) { return parser.tCL(state, session, startRow, endRow); },
                toggleBlockComment: function(state, session, range, cursor) { return parser.tBC(state, session, range, cursor); },

                //$getIndent: function(line) { return parser.indent(line); },
                getNextLineIndent: function(state, line, tab) { return parser.getNextLineIndent(state, line, tab); },
                checkOutdent: function(state, line, input) { return false; },
                autoOutdent: function(state, doc, row) { },

                //$createKeywordList: function() { return parser.$createKeywordList(); },
                getKeywords: function( append ) { 
                    var keywords = parser.Keywords;
                    if ( !keywords ) return [];
                    return keywords.map(function(word) {
                        var w = word.word, wm = word.meta;
                        return {
                            name: w,
                            value: w,
                            score: 1000,
                            meta: wm
                        };
                    });
                },
                getCompletions : function(state, session, pos, prefix) {
                    var keywords = parser.Keywords;
                    if ( !keywords ) return [];
                    var len = prefix.length;
                    return keywords.map(function(word) {
                        var w = word.word, wm = word.meta, wl = w.length;
                        var match = (wl >= len) && (prefix == w.substr(0, len));
                        return {
                            name: w,
                            value: w,
                            score: (match) ? (1000 - wl) : 0,
                            meta: wm
                        };
                    });
                }
            };
        },
        
        getMode = function(grammar, DEFAULT) {
            
            var LOCALS = { 
                    // default return code for skipped or not-styled tokens
                    // 'text' should be used in most cases
                    DEFAULT: DEFAULT || DEFAULTSTYLE,
                    ERROR: DEFAULTERROR
                }
            ;
            
            grammar = clone(grammar);
            // build the grammar
            var parsedgrammar = parseGrammar( grammar );
            //console.log(grammar);
            
            return getAceMode( new Parser( parsedgrammar, LOCALS ), grammar );
        }
    ;
      
    //
    // workers factories
    if ( isWorker )
    {
    
        var window = this;
        onmessage = function(e) {
            var msg = e.data;
            if (msg.load && msg.ace_worker_base) 
            {        
                // import an ace base worker with needed dependencies ??
                importScripts(msg.ace_worker_base);
                Init.call(window);
            } 
        };
        
        function Init()
        {
            ace.define('ace/grammar_worker', ['require', 'exports', 'module' , 'ace/worker/mirror'], function(require, exports, module) {

                exports.AceGrammarWorker = Class(require("./worker/mirror").Mirror, {

                    constructor: function( sender ) {
                        var ayto = this;
                        ayto.$superv('constructor', [sender]);
                        ayto.setTimeout( 500 );
                    },
                    
                    parser: null,
                    
                    
                    Init: function( grammar, id ) {
                        var ayto = this;

                        ayto.parser = new Parser( parseGrammar( grammar ), { DEFAULT: DEFAULTSTYLE, ERROR: DEFAULTERROR } );
                        ayto.sender.callback(1, id);
                    },
                    
                    
                    onUpdate: function() {
                        var ayto = this, sender = ayto.sender, parser = ayto.parser,
                            code, linetokens, tokens, errors,
                            line, lines, t, token, column, errorFound = 0
                        ;

                        if ( !parser )
                        {
                            sender.emit("ok", null);
                            return;
                        }
                        
                        code = ayto.doc.getValue();
                        if ( !code || !code.length ) 
                        {
                            sender.emit("ok", null);
                            return;
                        }
                        
                        errors = [];
                        linetokens = parser.parse( code );
                        lines = linetokens.length;
                        
                        for (line=0; line<lines; line++) 
                        {
                            tokens = linetokens[ line ];
                            if ( !tokens || !tokens.length )  continue;
                            
                            column = 0;
                            for (t=0; t<tokens.length; t++)
                            {
                                token = tokens[t];
                                
                                if ( parser.ERR == token.type )
                                {
                                    errors.push({
                                        row: line,
                                        column: column,
                                        text: token.error || "Syntax Error",
                                        type: "error",
                                        raw: token.error || "Syntax Error"
                                    });
                                    
                                    errorFound = 1;
                                }
                                column += token.value.length;
                            }
                        }
                        
                        if (errorFound)  sender.emit("error", errors);
                        else  sender.emit("ok", null);
                    }
                });
            });
        }
    }
  /**
*
*   AceGrammar
*   @version: 0.8.5
*
*   Transform a grammar specification in JSON format, into an ACE syntax-highlight parser mode
*   https://github.com/foo123/ace-grammar
*
**/
    
    //
    //  Ace Grammar main class
    /**[DOC_MARKDOWN]
    *
    * ###AceGrammar Methods
    *
    * __For node with dependencies:__
    *
    * ```javascript
    * AceGrammar = require('build/ace_grammar.js').AceGrammar;
    * // or
    * AceGrammar = require('build/ace_grammar.bundle.js').AceGrammar;
    * ```
    *
    * __For browser with dependencies:__
    *
    * ```html
    * <script src="../build/ace_grammar.bundle.js"></script>
    * <!-- or -->
    * <script src="../build/classy.js"></script>
    * <script src="../build/regexanalyzer.js"></script>
    * <script src="../build/ace_grammar.js"></script>
    * <script> // AceGrammar.getMode(..) , etc.. </script>
    * ```
    *
    [/DOC_MARKDOWN]**/
    DEFAULTSTYLE = "text";
    DEFAULTERROR = "invalid";
    var AceGrammar = exports['AceGrammar'] = {
        
        VERSION : "0.8.5",
        
        // extend a grammar using another base grammar
        /**[DOC_MARKDOWN]
        * __Method__: *extend*
        *
        * ```javascript
        * extendedgrammar = AceGrammar.extend(grammar, basegrammar1 [, basegrammar2, ..]);
        * ```
        *
        * Extend a grammar with basegrammar1, basegrammar2, etc..
        *
        * This way arbitrary dialects and variations can be handled more easily
        [/DOC_MARKDOWN]**/
        extend : extend,
        
        // parse a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *parse*
        *
        * ```javascript
        * parsedgrammar = AceGrammar.parse(grammar);
        * ```
        *
        * This is used internally by the AceGrammar Class
        * In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
        * However user can use this method to cache a parsedgrammar to be used later.
        * Already parsed grammars are NOT re-parsed when passed through the parse method again
        [/DOC_MARKDOWN]**/
        parse : parseGrammar,
        
        // get an ACE-compatible syntax-highlight mode from a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *getMode*
        *
        * ```javascript
        * mode = AceGrammar.getMode(grammar, [, DEFAULT]);
        * ```
        *
        * This is the main method which transforms a JSON grammar into an ACE syntax-highlight parser.
        * DEFAULT is the default return value ("text" by default) for things that are skipped or not styled
        * In general there is no need to set this value, unless you need to return something else
        [/DOC_MARKDOWN]**/
        getMode : getMode
    };
    
    /* main code ends here */
    /* export the module */
    return exports["AceGrammar"];
});