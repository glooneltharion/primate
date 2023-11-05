const path = ["pages", "error.html"];

export default root => root.join(...path).write(`<!doctype html>
<html>
  <head>
    <title>Error page</title>
    <meta charset="utf-8" />
    %head%
  </head>
  <body>
    <h1>Error page</h1>
    <p>
      %body%
    </p>
  </body>
</html>`);
