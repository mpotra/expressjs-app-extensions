/***************************************************************************
 * Extending ExpressJS < express@3.0.0beta1 >
 * Added .unuse method to express.application
 * Added .remove method to express.aplication
 *
 * @author Mihai Potra <mike@mpotra.com>
***************************************************************************/

var express = require('express');
/**
 * Enable unsetting routes set with .use
 */

var g_methods = [
    'get'
  , 'post'
  , 'put'
  , 'head'
  , 'delete'
  , 'options'
  , 'trace'
  , 'copy'
  , 'lock'
  , 'mkcol'
  , 'move'
  , 'propfind'
  , 'proppatch'
  , 'unlock'
  , 'report'
  , 'mkactivity'
  , 'checkout'
  , 'merge'
  , 'm-search'
  , 'notify'
  , 'subscribe'
  , 'unsubscribe'
  , 'patch'
];
 
 
express.application.unuse = function ( route, fn ) {
  if ('string' != typeof route) fn = route, route = '';
  
  for (var i = 0, len = this.stack.length; i < len; i++) {
    if (this.stack[i].route == route && this.stack[i].handle == fn ) {
      this.stack.splice(i, 1);
      return true;
    };
  }
  return false;
}
var flatten_array= function( arr ) {
  var farr = [];
  if( Array.isArray( arr ) ) {
    for(var i=0; i<arr.length; i++ ) {
      if( Array.isArray( arr[i] ) ) {
        farr = farr.concat( flatten_array( arr[i] ) );
      } else {
        farr.push( arr[i] );
      }
    }
    return farr;
  } else {
    return [ arr ];
  }
};

var remove_route = function( refArray, path, callbacks ) {
  if( Array.isArray( refArray ) ) {
    var removed_routes = [];
    for(var i=0; i < refArray.length; i++ ) {
      var route = refArray[i];
      var s_route_path  = route.path instanceof RegExp ? route.path.toString() : route.path ;
      var s_path        = path instanceof RegExp ? path.toString() : path;
      if( s_route_path == s_path  ) {
        if( callbacks.length ) {
          //remove all matching function from path
          if( Array.isArray( route.callbacks ) ) {
            for( var j=0; j < callbacks.length; j++ ) {
              var rc_index = route.callbacks.indexOf( callbacks[j] );
              if( rc_index > -1 ) {
                removed_routes.push( route.callbacks.splice( rc_index, 1 ) );
              }
            }
            if( route.callbacks.length == 0 ) {
              //if all callbacks are removed, remove route entirely
              refArray.splice( i, 1 );
            }
          }
        } else {
          //remove all callbacks from path
          removed_routes.push( refArray.splice( i, 1 ) );
        }
      }
    }
    return removed_routes;
  } else {
    return false;
  }
}
/**
 * Remove route
 */
express.application.remove = function ( method, path, callback ) {
  var args      = Array.prototype.slice.call( arguments );
  var methods   = ( this._router
                      && this._router.__proto__.constructor 
                      && this._router.__proto__.constructor.methods 
                      && Array.isArray(this._router.__proto__.constructor.methods) 
                    ? this._router.__proto__.constructor.methods.concat('del', 'all') 
                    : g_methods.concat('del', 'all')
                  );
  var method    = args.length && typeof args[0] == 'string' && methods.indexOf( args[0] ) > -1 ? args.shift() : 'all';
  var path      = args.length && ( typeof args[0] == 'string' || args[0] instanceof RegExp ) ? args.shift() : null;
  var callbacks = flatten_array( args );
  
  if( method == 'all' ) {
    if( this._router && this._router.map && typeof this._router.map == 'object' ) {
      var success = false;
      var app = this;
      if( path != null && path != '' ) {
        Object.keys( this._router.map ).forEach( function( keyName, index, keys ) {
          if( remove_route( app._router.map[ keyName ], path, callbacks ) ) {
            if( app._router.map[ keyName ].length == 0 ) {
              //if empty, remove method object
              delete app._router.map[ keyName ];
            }
            success = true;
          }
        });
        
        if( this.routes && typeof this.routes == 'object' ) { 
          app = this;
          Object.keys( this.routes ).forEach( function( keyName, index, keys ) {
            if( remove_route( app.routes[ keyName ], path, callbacks ) ) {
              if( app.routes[ keyName ].length == 0 ) {
                //if empty, remove method object
                delete app.routes[ keyName ];
              }
              success = true;
            }
          });
        }
      } else {
        Object.keys( this._router.map ).forEach( function( keyName, index, keys ) {
          delete app._router.map[ keyName ];
          success = true;
        });
        
        if( this.routes && typeof this.routes == 'object' ) { 
          Object.keys( this.routes ).forEach( function( keyName, index, keys ) {
            delete app.routes[ keyName ];
            success = true;
          });
        }
      }
      
      return success;
    } else {
      return false;
    }
  } else {
    if( this._router && this._router.map && this._router.map[ method ] && Array.isArray( this._router.map[method] ) ) {
      if( path != null && path != '' ) {
        //remove matching callbacks from [method] routes with the given path
        var result = remove_route( this._router.map[ method ], path, callbacks );
        if( this._router.map[ method ].length == 0 ) {
          //if empty, remove method object
          delete this._router.map[ method ];
        }
        
        if( this.routes && this.routes[ method ] ) {
          remove_route( this.routes[ method ], path, callbacks );
          if( this.routes[ method ].length == 0 ) {
            //if empty, remove method object
            delete this.routes[ method ];
          }
        }
        return !!result;
      } else {
        //remove all [method] routes
        delete this._router.map[ method ];
        if ( this.routes &&  this.routes[method] ) {
          delete this.routes[ method ];
        }
        return true;
      }
    } else {
      return false;
    }
  }
}

module.exports = express;