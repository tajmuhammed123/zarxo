const User = require("../models/usermodals");
const Products = require("../models/productModels");
const Order=require('../models/orderModels')

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');



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
      
      const filepathName = path.resolve(__dirname, '../views/admin/salereport.ejs');
      const html = fs.readFileSync(filepathName).toString();
      const ejsData = ejs.render(html, data);
      console.log('Generating PDF...');
      
      const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser', // Specify the path to the Chromium executable
        headless: true // Set headless mode as needed
      });
      console.log('nothing');
      const page = await browser.newPage();
      console.log('something');
      await page.setContent(ejsData, { waitUntil: 'networkidle0' });
      
      const pdfBytes = await page.pdf({ format: 'Letter' });
      await browser.close();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=Report.pdf');
      
      res.send(pdfBytes);
      
      console.log('PDF file generated successfully.');
      
    } catch (err) {
      console.log('Error:', err.message);
    }
  };


module.exports={
    saleReport
}