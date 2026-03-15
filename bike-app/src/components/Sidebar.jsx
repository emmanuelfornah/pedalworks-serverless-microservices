//import { ReactNode } from "react";
//import React from "react";
import { useCallback } from 'react';
import PropTypes from 'prop-types';

const S3_BUCKET_URL = import.meta.env.VITE_APP_S3_BUCKET_URL;

const Sidebar = ({ setBannerColor }) => {
  const handleColorClick = useCallback(
    (color) => {
      setBannerColor(color);
    },
    [setBannerColor]
  );

  return (
    <div className="sidebar">
      <h2>Store Location</h2>
      <div className="location-info" id="location">
        <p>
          <b>Address:</b>
          <br />
          100 Anywhere Street, Anytown, USA
        </p>
        <p>
          <b>Phone:</b>
          <br />
          1-800-555-1212
        </p>
        <p>
          <b>Hours:</b>
          <br />
          Mon-Fri 7am-7pm <br /> Sat 8am-6pm <br /> Sun closed
        </p>
      </div>
      <div className="map-img-div">
        <img src={`${S3_BUCKET_URL}/images/map.jpeg`} alt="" width={"130px"} />
        <a
          href="https://www.openstreetmap.org/search?query=nyc"
          target="_blank"
        >
          Get directions
        </a>
      </div>
      <div className="about-us" id="about-us">
        <h2>About Us</h2>
        <p>
          AnyCompany was founded by a group of friends who share a passion for
          bicycling and they all agree that it is always a great day to bike!
        </p>
        <img src={`${S3_BUCKET_URL}/images/biking-outdoors.jpeg`} alt="" />
        <div className="buttons">
          <button className="light-banner-btn" onClick={() => handleColorClick('dark')}>Dark Banner</button>
          <button className="light-banner-btn" onClick={() => handleColorClick('light')}>Light Banner</button>
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  setBannerColor: PropTypes.func.isRequired,
};

export default Sidebar;
