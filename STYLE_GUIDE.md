Style guide:  we are writing a Meteor v3 app, using React and MaterialUI app.  

Add the path and name of the file as the first line of each file (commented out)

We are using the Meteor v3 toolchain, with ES6 style async/await patterns. We prefer function() syntax instead of ES6 style => arrow syntax. 

We use the lodash library for circuit breaker pattern when accessing JSON objects, so feel free to generously use get() and set() functions and specify default values.  Do *not* import the _ function; do explicitly import each function.

For date time operations, use the moment library.  

We are writing a 12 Factor app, so will wish to specify key configuration params via environment variables, which then get attached to the Meteor.settings on server startup, and later accessed elsewhere in the app.  

When possible, files should be written in such a way that they can be refactored into an Atmosphere.js package later.

IMPORTANT:  On the server, be sure to use Meteor v3 API, including getTextAsync, findAsync, insertAsync, updateAsync, removeAsync, countAsync, etc.

Development environment is MacOS ARM64.  When multiple clients are run, they will likely be run on the same machine, using ports 3000 and 4000 respectively.  

When returning code, check with the user, whether a script, bash commands, or javascript file is desired.  

Use the meteor/fetch package for HTTP calls.

Don't ever suggest webpack, vite, or other bundlers.  

Avoid directory index.js files.

When routing between pages, always use the useNavigate hook; Don't use window.location.href

Stive to always balance conditional if/then statements, and give a console message during the negative case.  Don't silently swallow the conditional.  

Do use the full gamut of console messages:  console.warn, console.error, console.group, etc.
