import React from "react";
import "./Home.css";
import Hero from "../Herosec/Hero";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <div className="navbar">
        <div className="nav-logo">
          Inter<span>view</span>
        </div>
        <div className="nav-About">
          <li>
            <Link to="/"> About</Link>
          </li>
        </div>
      </div>
      <Hero />
    </div>
  );
};

export default Home;
