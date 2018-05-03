module.exports = {
    apps : [{
      name        : "nene-two",
      script      : "./server.js",
      watch       : true,
      ignore_watch: ["node_modules","music"],
      env: {
        "NODE_ENV": "development",
        "TOKEN": "",
        "PORT": 3030
      }
    }]
  }
  