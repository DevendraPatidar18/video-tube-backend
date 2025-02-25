require('dotenv').config()

const express = require('express')

const app = express()



app.get('/',(req,res) => {
    res.send("hello word")
})

app.get('/twitter',(req,res) => {
    res.send("Devendra patidar")
})

app.listen(process.env.PORT, () => {
    console.log(`App is listening on port ${process.env.PORT}`)
} )