//import dotenv from 'dotenv';
//dotenv.config({ path: '.env' });
import 'dotenv/config';
import express from"express";
import {DB_NAME} from "./constants.js"
import connectDB from "./database/connetctDB.js"

const port = process.env.PORT || 3000;

const app = express()
await connectDB()


const userData = {

    "user_view_type": "public",
    "site_admin": false,
    "name": null,
    "company": null,
    "blog": "",
    "location": null,
    "email": null,
    "hireable": null,
    "bio": null,
    "twitter_username": null,
    "public_repos": 0,
    "public_gists": 0,
    "followers": 6,
    "following": 0,
    "created_at": "2016-03-01T18:11:15Z",
    "updated_at": "2016-03-01T18:11:15Z"
  }


app.get('/',(req,res) => {
    res.send("hello word")
})

app.get('/userdata',(req,res) => {
    res.json(userData)
})

app.get('/twitter',(req,res) => {
    res.send("Devendra patidar")
})

app.listen(port, () => {
    console.log(`App is listening on port ${port}`)
} )