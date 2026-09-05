import { useState, useEffect } from "react";
import axios from "axios";

const API_GATEWAY_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;
const IMAGE_BASE_URL =
  import.meta.env.VITE_APP_S3_BUCKET_URL || '/images';

const Products = () => {
  const [productsList, setProductsList] = useState([]);

  // Fetch products from the API
  useEffect(() => {
    axios
      .get(`${API_GATEWAY_BASE_URL}/get_products/`)
      .then((res) => {
        // The API may return either a bare array or an object like
        // { products: [...] }. Normalize to an array so rendering works
        // regardless of which Lambda version is deployed.
        const data = res.data;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];
        setProductsList(items);
      })
      .catch((err) => console.log(err)); // Log any errors
  }, []);

  // Update initial quantities based on productsList
  useEffect(() => {
    if (Array.isArray(productsList) && productsList.length > 0) {
      const newInitialQuantities = productsList.reduce((acc, product) => {
        acc[product.product_name] = {
          id: parseInt(product.id),
          quantity: 0,
          price: product.price,
        };
        return acc;
      }, {});
      setFormInfo(newInitialQuantities); // Set initial quantities based on the current products list
    }
  }, [productsList]); // This effect depends on productsList

  const [formInfo, setFormInfo] = useState({});

  const changeHandler = (e) => {
    const { name, value } = e.target;
    const productInfo = formInfo[name]; // Retrieve current product info

    setFormInfo({
      ...formInfo,
      [name]: {
        ...productInfo, // Spread existing product info
        quantity: parseInt(value), // Only update the quantity
      },
    });
  };

  function toSentenceCase(str) {
    return str.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
  }

  // Function to compute total price
  const calculateTotal = () => {
    if (Array.isArray(productsList) && productsList.length > 0) {
      return productsList
        .reduce((total, product) => {
          const quantity = formInfo[product.product_name]?.quantity || 0;
          const price = parseFloat(product.price);
          return total + price * quantity;
        }, 0)
        .toFixed(2); // Use toFixed(2) to format it as a decimal number
    } else {
      return '0.00';
    }
  };

  const [orderStatus, setOrderStatus] = useState(null);

  const submitHandler = (e) => {
    e.preventDefault();

    // Only send items with a quantity greater than zero.
    const items = Object.entries(formInfo).filter(
      ([, info]) => (info?.quantity || 0) > 0
    );
    if (items.length === 0) {
      setOrderStatus({ type: "error", message: "Add at least one item before submitting." });
      return;
    }

    setOrderStatus({ type: "pending", message: "Submitting order..." });

    // POST /orders — payload is a map of { product_name: { id, quantity, price } }
    axios
      .post(`${API_GATEWAY_BASE_URL}/orders`, formInfo)
      .then((res) => {
        const orderId = res.data?.order_id;
        setOrderStatus({
          type: "success",
          message: orderId ? `Order placed! Order ID: ${orderId}` : "Order placed!",
        });
      })
      .catch((err) => {
        console.error("Error submitting order:", err);
        setOrderStatus({ type: "error", message: "Could not submit order. Please try again." });
      });
  };

  return (
    <div className="products" id="products-link">
      <h2>Products</h2>
      <form onSubmit={submitHandler} id="order_form">
        <div className="products-grid">
          {Array.isArray(productsList) && productsList.length > 0 ? (
            productsList.map((product, idx) => (
              <div key={idx} className="product-item">
                <img
                  src={`${IMAGE_BASE_URL}/${product.image_url}`}
                  alt={product.product_name}
                  height={"200px"}
                />
                <p>
                  {toSentenceCase(product.product_name)} ${product.price}
                </p>
                <p>
                  Quantity:{" "}
                  <input
                    type="number"
                    name={product.product_name}
                    value={formInfo[product.product_name]?.quantity || 0}
                    onChange={changeHandler}
                  />
                </p>
                <p>Left in stock: {product.inventory_count}</p>
              </div>
            ))
          ) : (
            <p>Loading...</p>
          )}
        </div>
        <input type="submit" value="Submit" />
      </form>
      {orderStatus && (
        <p className={`order-status order-status-${orderStatus.type}`}>
          {orderStatus.message}
        </p>
      )}
      <h3>Total Price: ${calculateTotal()}</h3>
    </div>
  );
};

export default Products;