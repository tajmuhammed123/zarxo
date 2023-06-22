const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({

    product_category:{
        type:String,
        require:true
    },
    id_disable:{
        type:Boolean,
        default:false
    }


})
module.exports = mongoose.model("Category",CategorySchema)