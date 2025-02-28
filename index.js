//import dotenv from 'dotenv';
//dotenv.config({ path: '.env' });
import 'dotenv/config';
import {DB_NAME} from "./src/constants.js"
import connectDB from "./src/database/connetctDB.js"
import {app} from "./src/app.js"

const port = process.env.PORT || 3000;


await connectDB().
then(() => {
    app.listen(port,() => {
        console.log(`Server is running at prot ${port}`)
    })
})
.catch((error) => {
    console.log("MONGO db connection failed !!!",error)
})


