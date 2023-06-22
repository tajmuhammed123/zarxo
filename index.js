require('./database')

const path=require('path')
const express=require('express')

const app = express()

const userRouter = require('./routes/userRouter')
app.use('/',userRouter)

const adminRouter=require('./routes/adminRouter')
app.use('/admin',adminRouter)

app.use(express.static(path.join(__dirname,"/public")))
app.use('/docs', express.static(path.join(__dirname, 'docs')));

app.listen(3000, ()=>{
    console.log('server running');
})
