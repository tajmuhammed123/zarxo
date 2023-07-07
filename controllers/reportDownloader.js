const User = require("../models/usermodals");
const Products = require("../models/productModels");
const Order=require('../models/orderModels')

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');



const pdf = require('html-pdf');

const saleReport = async (req, res) => {
  try {
    const adminid = req.session.admin_id;
    const admin = await User.findById(adminid).lean();

    const to = new Date();
    const day = parseInt(req.query.day);
    const from = new Date(to.getTime() - day * 24 * 60 * 60 * 1000);
    console.log(typeof day);

    const [orderData, totalEarnings, usercount, productcount, ordercount] = await Promise.all([
      Order.aggregate([
        { $unwind: '$product_details' },
        { $match: { 'product_details.product_status': 'Delivered', 'product_details.deliver_date': { $gte: from, $lte: to } } }
      ]),
      Order.aggregate([
        { $unwind: '$product_details' },
        { $match: { 'product_details.product_status': 'Delivered', 'product_details.deliver_date': { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$product_details.product_price' } } }
      ]),
      User.countDocuments({ is_admin: 0 }),
      Products.countDocuments({ id_disable: false }),
      Order.countDocuments({ 'product_details.product_status': 'Delivered' })
    ]);

    const earnings = totalEarnings.length > 0 ? totalEarnings[0].total : 0;
    console.log('Total earnings:', earnings);

    const data = {
      admin: admin,
      orderData: orderData,
      usercount: usercount,
      earnings: earnings,
      ordercount: ordercount,
      productcount: productcount,
      day: day
    };

    // Render the EJS template with the data
    const filepathName = path.resolve(__dirname, '../views/admin/salereport.ejs');
    const html = fs.readFileSync(filepathName).toString();
    const ejsData = ejs.render(html, data);
    console.log('Generating PDF...');

    // Convert HTML to PDF using html-pdf
    pdf.create(ejsData, {}).toBuffer((err, buffer) => {
      if (err) {
        console.error('Error generating PDF:', err);
        res.status(500).send('An error occurred while generating the PDF');
      } else {
        // Send the generated PDF file as a download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
        res.send(buffer);
        console.log('PDF file generated successfully.');
      }
    });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).send('An error occurred while generating the PDF');
  }
};



module.exports={
    saleReport
}