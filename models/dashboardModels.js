const mongoose = require('mongoose')

const DashboardSchema = new mongoose.Schema({

    total_users:{
        type:Number,
        default:0
    },
    items_sold:{
        type:Number,
        default:0
    },
    total_products:{
        type:Number,
        default:0
    },
    total_earnings:{
        type:Number,
        default:0
    },
    cod:{
        type:Number,
        default:0
    },
    online:{
        type:Number,
        default:0
    }


})
module.exports = mongoose.model("Dashboard",DashboardSchema)