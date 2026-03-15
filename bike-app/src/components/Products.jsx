import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { Link, Routes, Route } from 'react-router-dom';

const API_GATEWAY_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;
const S3_BUCKET_URL = import.meta.env.VITE_APP_S3_BUCKET_URL;

const Products = () => {
  const navigate = useNavigate()
  const [productsList, setProductsList] = useState([]);

  // Fetch products from the API
  useEffect(() => {
    axios
      .get(`${API_GATEWAY_BASE_URL}/get_products/`)
      .then((res) => {
        console.log("got response from api!", res.data);
        setProductsList(res.data);
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

  const submitHandler = (e) => {
    e.preventDefault();
    // TODO: make a post request to backend to create a new order
    console.log(formInfo)
    // send to backend via a POST request
    axios.post(`${API_GATEWAY_BASE_URL}/orders`, formInfo)
      .then((res) => {
        console.log("got back response from api", res.data)
        navigate(`/lookup_order/${res.data.order_id}`)
      })
      .catch((err) => {
        console.error("Error submitting order:", err);
        // Handle the error appropriately, e.g., display an error message
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
                  src={`${S3_BUCKET_URL}/${product.image_url}`}
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
      <h3>Total Price: ${calculateTotal()}</h3>
    </div>
  );
};

export default Products;