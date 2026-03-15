import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_GATEWAY_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

const OrderDetails = () => {
  const { orderId } = useParams();  // Extract orderId from the URL
  const [orderDetails, setOrderDetails] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(()=>{
    axios.get(`${API_GATEWAY_BASE_URL}/orders/${orderId}`)
      .then(res=>{
        console.log('response from get order details', res.data)
        setOrderDetails(res.data.order)
        setLoaded(true)
      })
      .catch(console.log)
  },[orderId])

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

  if(!loaded){
    return (
      <div className="order-details">
      <h2>Order Confirmation</h2>
      <p>Loading your information...</p>
      </div>
    )
  }

  return (
    <div className="order-details">
      <h2>Order Confirmation</h2>
      <h4>YOUR ORDER DETAILS</h4>
      <div>
        <h2>Order Summary</h2>
        <table className="order_summary">
          <tbody>
            <tr>
              <td>Order number:</td>
              <td>{orderDetails.id}</td>
            </tr>
            <tr>
              <td>Order time:</td>
              <td>{formatDate(orderDetails.order_date_time)}</td>
            </tr>
            <tr>
              <td>Total amount:</td>
              <td>${orderDetails.total_amount}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h2>Order Line Items</h2>
        <table className="order_summary">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {orderDetails.order_items.map(item => (
              <tr key={item.product_id}>
                <td>{item.product_id}</td>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>${item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderDetails;