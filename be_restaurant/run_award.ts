import sequelize from './src/config/database'
import { Op } from 'sequelize'
import Order from './src/models/Order'
import OrderService from './src/services/orderService'

;(async ()=>{
  try{
    // ensure DB connection
    await sequelize.authenticate()
    console.log('DB connected')
    const order = await Order.findOne({ where: { payment_status: { [Op.ne]: 'paid' } }, order: [['created_at','DESC']] })
    if(!order){ console.log('No unpaid orders found'); process.exit(0); }
    console.log('Found order:', { id: order.id, status: order.status, payment_status: order.payment_status, user_id: order.user_id, final_amount: order.final_amount })
    const res = await OrderService.handlePaymentSuccess(order.id)
    console.log('handlePaymentSuccess result:', { id: res.id, status: res.status, payment_status: res.payment_status })
    process.exit(0)
  }catch(e){ console.error(e); process.exit(1) }
})()
