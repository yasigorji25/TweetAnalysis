const express = require('express');
const router = require('./routes');
const path = require('path');
const app = express();

const hostname = '127.0.0.1';
const port = 3000;

app.use(express.static('../client/build'))

app.get('/', (req, res) => {
    const str =  'XXXX';

    res.writeHead(200,{'content-type': 'text/html'});
    res.write(str);
    res.end();
});

app.use('/',router); 

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  })
  
app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});
