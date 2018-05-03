module.exports = {
    apps : [{
      name        : "nene-two",
      script      : "./server.js",
      watch       : true,
      env: {
        "NODE_ENV": "development",
        "TOKEN": "",
        "PORT": 3030
      }
    }]
  }
  