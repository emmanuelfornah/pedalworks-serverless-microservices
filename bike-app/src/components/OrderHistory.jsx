import { useState, useEffect } from "react";
import axios from "axios";
import {Link} from 'react-router-dom'

const API_GATEWAY_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;
const S3_BUCKET_URL = import.meta.env.VITE_APP_S3_BUCKET_URL;

const OrderHistory = () => {
  const [orders, setOrders] = useState([])

  useEffect(()=>{
    axios.get(`${API_GATEWAY_BASE_URL}/orders`)
    .then(res=>{
      console.log('response from get order details', res.data)
      const sorted = res.data.orders.slice().sort((a,b)=>a.id>b.id?1:-1)
      setOrders(sorted)
    })
    .catch(console.log)
  }, [])

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  return (
    <div className="order-history">
      <h2>Order History</h2>
      <table className="order_summary">
        <thead>
          <tr>
            <th>ORDER NUMBER</th>
            <th>ORDER TIME</th>
            <th>TOTAL AMOUNT</th>
            <th>DETAILS</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, key)=>{
            return (
              <tr key={key}>
            <td>{order.id}</td>
            <td>{formatDate(order.order_date_time)}</td>
            <td>${order.total_amount}</td>
            <td>
              <Link to={`/absproxy/8081/lookup_order/${order.id}`}>Order details</Link>
            </td>
          </tr>
            ) 
          })}
          
        </tbody>
      </table>
    </div>
  );
};

export default OrderHistory;