let express = require("express");
let http = require("http");
let ejs = require("ejs");
let app = express();
let path = require('path');
let server = http.createServer(app).listen(8080, function () {
    console.log("listening");
});
app.use('/lib', express.static(path.join(__dirname, 'lib')));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.get('/', (req, res) => {
    ejs.renderFile(__dirname + "/index.html", {}, {}, function (err, str) {
        if (err) throw err;
        res.send(str);
    });
})
