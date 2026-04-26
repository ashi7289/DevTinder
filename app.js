const express= require('express')
const app=express()

app.use('/test',(req, res)=>{
    res.send('oiiii')
})


app.listen(7777,()=>{
    console.log('testing')
})