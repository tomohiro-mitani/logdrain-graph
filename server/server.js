import SourceMapSupport from 'source-map-support';
SourceMapSupport.install();
import 'babel-polyfill';

import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import Issue from './issue.js';

const app = express();
const basicAuth = require('express-basic-auth')
//var syslogParser = require('glossy').Parse;

app.use(express.static('static'));
app.use(bodyParser.text({ type: 'application/logplex-1' }));
app.use(basicAuth({
    users: { 'user': 'pass' },
    challenge: true,
    realm: 'Imb4T3st4pp',
}))


let db;

app.get('/api/issues', (req, res) => {
  db.collection('issues').find().toArray()
  .then(issues => {
    const metadata = { total_count: issues.length };
    res.json({ _metadata: metadata, records: issues });
  })
  .catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});

app.post('/api/issues', (req, res) => {
  const newIssue = req.body;
  newIssue.created = new Date();
  if (!newIssue.status) {
    newIssue.status = 'New';
  }

  const err = Issue.validateIssue(newIssue);
  if (err) {
    res.status(422).json({ message: `Invalid request: ${err}` });
    return;
  }

  db.collection('issues').insertOne(Issue.cleanupIssue(newIssue)).then(result =>
    db.collection('issues').find({ _id: result.insertedId }).limit(1)
    .next()
  )
  .then(savedIssue => {
    res.json(savedIssue);
  })
  .catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});

app.post('/logs', (req, res) => {
//  const logdrain = req.body;
  console.log('echo!');
//  console.log(logdrain);
  console.log(req.body);
  console.log('Scream!');
  res.status(200).json({ message: `OK:`});
  return;
});


app.get('/api/graph', (req, res) => {
  db.collection('graph').find().toArray()
  .then(graph => {
    const metadata = { total_count: graph.length };
    res.json({ _metadata: metadata, records: graph });
  })
  .catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});


MongoClient.connect(process.env.MONGODB_URI).then(connection => {
  db = connection;
  app.listen(process.env.PORT, () => {
    console.log('App started');
  });
}).catch(error => {
  console.log('ERROR:', error);
});
/*
MongoClient.connect('mongodb://localhost/issuetracker').then(connection => {
  db = connection;
  app.listen(3000, () => {
    console.log('App started on port 3000');
  });
}).catch(error => {
  console.log('ERROR:', error);
});
*/
/*
app.listen(process.env.PORT);
*/
