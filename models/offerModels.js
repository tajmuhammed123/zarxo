const mongoose = require('mongoose')


const OfferSchema = new mongoose.Schema({
    offer_code:{
        type:String,
        required:true
    },
    offer_amount:{
        type:Number,
        required:true
    }
})





module.exports= mongoose.model('Offer',OfferSchema)