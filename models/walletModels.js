const mongoose = require('mongoose')

const WalletHistory = new mongoose.Schema({

    transaction_amount:{
        type:String,
        require:true
    }


})
const WalletSchema = new mongoose.Schema({

    wallet_amount:{
        type:Number,
        require:true
    },
    user_id:{
        type:String,
        require:true
    },
    wallet_history:[WalletHistory]


})
module.exports = mongoose.model("Wallet",WalletSchema)