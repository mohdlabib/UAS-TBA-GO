const http = require('http');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;
const namaFile = path.join(__dirname, '/db/database.json');

// add json
let objekData;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'db', 'foto')));
app.use('/videos', express.static(path.join(__dirname, 'db', 'video')));

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).send(content);
        }
    });
});

io.on('connection', async (socket) => {
    console.log('Client terhubung');

    // get json data
    try {
        objekData = JSON.parse(await fs.readFile(namaFile, 'utf8'));
    } catch (err) {
        console.error('Error reading JSON file:', err);
    }

    // menerima kata
    socket.on('word', (data) => {
        let titleWord = {}

        if (objekData[data]) {
            titleWord = {
                char: data,
                word: Object.keys(objekData[data])
            }
        } else {
            titleWord = {
                char: data,
                word: []
            }
        }

        io.emit('word', titleWord);
    })

    // menerima kalimat
    socket.on('sentence', (data) => {
        let sentence = {}   
        let kata = objekData[data['char']]

        if (kata[data['word']]) {
            sentence = {
                char: data['char'],
                word: data['word'],
                sentence: Object.keys(kata[data['word']])
            }
        } else {
            sentence = {
                char: data['char'],
                word: data['word'],
                sentence: []
            }
        }

        io.emit('sentence', sentence);
    })

    // menerima informasi
    socket.on('information', (data) => {
        let information = {}   

        let kata = objekData[data['char']]
        let kalimat = kata[data['word']]

        if (kalimat[data['sentence']]) {
            information = kalimat[data['sentence']]
        } 

        io.emit('information', information);
    })

    socket.on('disconnect', () => {
        console.log('Client terputus');
    })
})

server.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`)
});
