import http from 'k6/http';
import { check } from 'k6';
import file from 'k6/x/file';
import { checktIDInFile, waitForTicketIdCallback } from './controllers/cosignerController.js';

const filepath = 'logs.txt';

export default function () {
    

   console.log(`${__VU} -- ${__ITER} -- before ${Date.now()}`)

   let found =  waitForTicketIdCallback(tid);

   console.log(`${__VU} -- ${__ITER}  -- ticket id found -- ${found} at ${Date.now()}`)


    // Remove rows from text file/clear file content/delete file
    // file.removeRowsBetweenValues(filepath, 2, 2);
    
}