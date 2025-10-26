import sequelize from './src/config/database'
import { Op } from 'sequelize'
import Order from './src/models/Order'
import User from './src/models/User'
import Notification from './src/models/Notification'
import OrderService from './src/services/orderService'

;(async ()=>{
  try{
    await sequelize.authenticate()
    console.log('DB connected')

    const order = await Order.findOne({ where: { payment_status: { [Op.ne]: 'paid' } }, order: [['created_at','DESC']] })
    if(!order){ console.log('No unpaid orders found'); process.exit(0); }
    console.log('Found order (pre):', { id: order.id, status: order.status, payment_status: order.payment_status, user_id: order.user_id, final_amount: order.final_amount })

    const res = await OrderService.handlePaymentSuccess(order.id)
    console.log('handlePaymentSuccess result:', { id: res.id, status: res.status, payment_status: res.payment_status })

    const updatedOrder = await Order.findByPk(order.id)
    const user = await User.findByPk(order.user_id)
    const latestNotification = await Notification.findOne({ where: { user_id: order.user_id, type: 'loyalty_points_awarded' }, order: [['sent_at','DESC']] })

    console.log('Updated order:', { id: updatedOrder?.id, status: updatedOrder?.status, payment_status: updatedOrder?.payment_status })
    console.log('User after award:', { id: user?.id, points: user?.points, ranking: user?.ranking })
    console.log('Latest loyalty notification:', latestNotification?.toJSON())

    process.exit(0)
  }catch(e){ console.error(e); process.exit(1) }
})()
