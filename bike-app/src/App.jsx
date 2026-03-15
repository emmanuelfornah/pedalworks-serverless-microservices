import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Services from "./components/Services";
import Products from "./components/Products";
import { Link, Routes, Route } from 'react-router-dom';

// once the .env is added and the S3 bucket is linked, use the S3 bucket images, until then use the public images directory
// S3 bucket implementation occurs in lab 2
const imageUrl = import.meta.env.VITE_APP_S3_BUCKET_URL ? import.meta.env.VITE_APP_S3_BUCKET_URL : 'images';

function App() {
  const [bannerColor, setBannerColor] = useState("dark");

  const handleBannerButtonClick = (color) => {
    if (color !== "dark" && color !== "light") {
      console.error("Invalid color value. Must be 'dark' or 'light'.");
      return; // Exit the function if the color is invalid
    }
    setBannerColor(color);
  };

  return (
    <main>
      <div className="App">
        <nav>
          <div className={`banner banner-${bannerColor}`}>
            {
              bannerColor === 'dark' ?
                <img src={`${imageUrl}/logo-black.png`} alt="" /> :
                <img src={`${imageUrl}/logo-white.png`} alt="" />
            }
            <h1>AnyCompany bicycle parts</h1>
          </div>
        </nav>
        <div className="nav-menu">
          <a href="/#products">Products</a>
          <a href="/#services">Services</a>
          <a href="/#location">Location</a>
          <a href="/#about-us">About us</a>
        </div>
        <div className="flex-mid">
          <Products />
          <Sidebar setBannerColor={handleBannerButtonClick} />
        </div>

        <Services />
        <div className="footer">
          <p>
            © {new Date().getFullYear()}, Amazon Web Services, Inc. or its
            Affiliates. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}

export default App;
