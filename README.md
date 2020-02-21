
# XCMP: eXtremely accurate object Comparison!
Ever tried to compare two JS variables for equality? Something like this:

```js
var apples = ['apple', 'avocado'];
var oranges = 'lemon';
if (apples === oranges)
  console.log("Hadn't I told you?");
else
  console.log("Not the same?! But they are both blue!")
```

See? It's just as simple as using a `===` between the variables we want to compare!

But wait.

What about this one?

```js
var applesHere = ['apple', 'apple'];
var applesThere = ['apple', 'apple'];

if (applesHere === applesThere)
  spareHumankind();
else
  annuhilatePlanetEarth();
```

In the rather sad example above, `applesHere` and `applesThere` are **referentially distinct** (i.e., they refer to different memory addresses), but **structurally equivalent**, that is, they have the exact same shape and content; they would have been equal if they were compared the right way. 

The moral of the snippet above, of course, is that using `===` indiscriminately can have really tragic consequences. :(

Had we used the structural-comparison-superpowers of `xcmp`, though, our little blue mudball of a planet might have survived unannihilated:

```sh
npm install xcmp
```

```js
var xcmp = require('xcmp');

var applesHere = ['apple', 'apple'];
var applesThere = ['apple', 'apple'];

if (xcmp.xcmpEqual(applesHere, applesThere))
  spareHumankind();
else
  annihilatePlanetEarth();
```

It's not even that! `xcmp` can handle even more complex cases like this:

```js
var xcmp = require('xcmp');

var a = []; a.push(a);

var b = []; b.push(b);

console.log(xcmp.xcmpEqual(a,b)); // True!
```
... or this:

```js
var xcmp = require('xcmp');

var a = []; a.push([a]);

var b = []; b.push([[b]]);

console.log(xcmp.xcmpEqual(a,b)); // True!
```

... or even this: (on which even `node`'s very own `assert.deepEqual` fails!)

```js
var xcmp = require('xcmp');

var a = []; a.push(a);

var b = []; b.push([b]);

console.log(xcmp.xcmpEqual(a,b)); // True! 
```

... And don't worry, a typo in the call to the annihilation function, above, resulted in a run-time error before the annihilation was launched. 

But please be very careful next time! :)

# Advanced Usage
Even though it is perfectly fine to call `xcmpEqual` as `xcmpEqual(someObj, someOtherObj)`, `xcmp` has quite more to provide -- it can receive extra parameters that can, to a reasonable extent, modify the way xcmp works.

The full signature of `xcmp.xcmpEqual` is as follows: 
(N.B. ***none of the parameters below are mandatory***)

```typescript
function xcmpEqual(
  left: any,
  right: any, 
  extras: {
    notEq:
      function(reason: String, leftV: any, rightV: any, uncommonKey: string): void,
      // this is called whenever a difference between  has been found.
      // reason can hold the following values:
      //   'notEqValues': left is not structurally equavalent to right because
      //                leftV and rightV do not have equal types or they are not
      //                structurally comparable (i.e., one is an object while the
      //                other isn't, or both are value-types but have inequal
      //                values
      //   'notEqStruct': left is not structurally equivalent to right because
      //               even though they are structurally comparable, leftV and
      //               rightV have either inequivalent recursive substructures
      //               or they have at least one uncommon key; in the case of
      //               recursive inequality, `uncommonKey` has value `undefined`
      
    objEq:
      function(a: Object, b: Object): bool,
      // test whether a and b are equal; the default function provided would
      // just check whether `a === b`

    sort:
      function(arr: Array<any>): Array<any>,
      // when comparing a pair of objects, sorts their keys before comparing them
      // the default function is a simple acending quick-sort

    enterKey:
      function(keyName: string|int) void,
      // if `keyTrack` option is true, `enterKey` can be used to track
      // child objects listed under a container object.
      // it can be used to pin the exact path of inequality in `left` and `right`.

    exitKey:
      function() void
      // if `keyTrack` option is true, `exitKey` exits the latest entered key

    failFast:
      bool,
      // if this switch is false, object comparison would traverse *every*
      // in the `left` and `right` values before actually returning false.
      // otherwise it would report the objects as inequal on encountering the first
      // uncommon key
      // default: true


    keyTrack:
      bool,
      // track the key names; e.g., given `{'a': {'b': 40 }}` and `{'a': {'b': 55}}`, if `keyTrack` is true,
      // `enterKey` and `exitKey` are called like this:
      // <start traversing {'a': {'b': 40 } }
      // enterKey('a');
      // <start traversing {'b': 40}
      // enterKey('b')
      // exitKey()
      // exitKey()
      //
      // default: false
  }
)
```
