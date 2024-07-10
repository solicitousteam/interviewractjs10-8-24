import React, { useState } from "react";
import "./Hero.css";
import Imag1 from "../assets/Imag1.jpg";
import Imag2 from "../assets/Imag2.jpg";
import Imag3 from "../assets/Imag3.jpg";
import Studentportal from "../studentportel/Studentportal";
import Customain from "../customain/Customain";

const Hero = () => {
  const [selectBtn, setSelectBtn] = useState(true);
  const [selectBtn2, setSelectBtn2] = useState(true);

  const handleButton = () => {
    setSelectBtn(!selectBtn);
  };

  const handleButton2 = () => {
    setSelectBtn2(!selectBtn2);
  };

  const renderImage = () => {
    if (!selectBtn2) {
      return <Studentportal />;
    } else if (!selectBtn) {
      return <Customain />;
    } else {
      return;
    }
  };

  return (
    <>
      <div>
        {renderImage()}
        {selectBtn2 && selectBtn ? (
          <div className="hero">
            <div className="hero-img">
              <img src={Imag1} alt="no" />
            </div>
            <div className="hero-con">
              <div className="hero-con1">
                <img src={Imag2} alt="no" />
                <div className="deaft-btn">
                  <button onClick={handleButton2}>default interview</button>
                </div>
              </div>
              <div className="hero-con1">
                <img src={Imag3} alt="no" />
                <div className="deaft-btn">
                  <button onClick={handleButton}>custom interview</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default Hero;
