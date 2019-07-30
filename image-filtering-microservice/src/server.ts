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

  // Path for storing images
  const util_dir = path.join(__dirname, '/util/');

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Image Filter Endpoint
  // Downloads image from the url in query, applies edge detector filter on the image
  // and returns the filtered image. (Url validation done through request-promise)
  app.get("/filteredimage", async (req, res) => {

    var options = {
      method: 'GET',
      uri: req.query.image_url,
      resolveWithFullResponse: true,
      encoding: null
    };

    rp(options)
    .then(function(response : Response){

      // check if content is of type image
      if (response.headers["content-type"].search('image') == -1) {
        res.status(422).send('No image found at given url.');
      } else {

        // set paths to write image files
        console.log("Util dir : %j", util_dir);
        const fileName = Math.floor(Math.random() * 2000)+'.jpg';
        const raw_save_path = util_dir + "in" + fileName;
        const filtered_save_path = util_dir + "out" + fileName;

        // write body to file
        let writer = fs.createWriteStream(raw_save_path);
        writer.write(response.body);
        writer.end();
        
        // apply cv2 canny edge filter through python script 
        const pythonProcess = spawn ('python', [util_dir+"image_filter.py", raw_save_path, filtered_save_path])
        if (pythonProcess !== undefined) {
          pythonProcess.stdout.on('data', (data) => {
            // Return the filtered image and delete local files
            res.status(200).sendFile(filtered_save_path, ()=> {
              deleteLocalFiles([raw_save_path, filtered_save_path]);
            });
          });
      } else {
        res.status(500).send('An error occured while filtering image.');
      }
        
      }
    })
    .catch(function (err: RequestError){
      res.status(500).send(err.message);
    });
  });


  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );

})();