import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import {spawn} from 'child_process';
import { Response } from 'request';
import {write} from 'fs';
import { RequestError } from 'request-promise/errors';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Init for downloading images
  const fs = require('fs');
  const path = require('path');
  const rp = require('request-promise');

  // Paths for storing images
  const in_path = '/util/in/'
  const out_path = '/util/out/'

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Image Filter Endpoint
  // Downloads image from the url in query, applies edge detector filter on the image
  // and returns the filtered image. (Url validation done through Request-Promise)
  app.get("/filteredimage", async (req, res) => {

    var options = {
      method: 'GET',
      uri: req.query.image_url,
      encoding: null,
      resolveWithFullResponse: true
    };

    rp(options)
    .then(function(response : Response){

      // check if content is of type image
      if (response.headers["content-type"].search('image') == -1) {
        res.status(422).send('No image found at given url.');
      } else {

        // setup in directory and path
        const in_dir = path.join(__dirname, in_path);
        const in_save_path = in_dir+Math.floor(Math.random() * 2000)+'.jpg';

        // write body to file
        let writer = fs.createWriteStream(in_save_path);
        writer.write(response.body);

        // setup out directory and path
        const out_dir = path.join(__dirname, out_path);
        const out_save_path = out_dir+Math.floor(Math.random() * 2000)+'.jpg';

        // apply cv2 canny edge filter through python script 
        const pythonProcess = spawn ('python3', ["src/util/image_filter.py", in_save_path, out_save_path])
        if (pythonProcess !== undefined) {
            pythonProcess.stdout.on('data', (data) => {
              res.status(200).sendFile(out_save_path, ()=> {
                deleteLocalFiles([in_save_path, out_save_path]);
              });
            });
        } else {
          res.status(500).send('An error occured while filtering image.');
        }
      }
    })
    .catch(function (err: RequestError){
      res.status(520).send(err.message);
    });
  });


  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();