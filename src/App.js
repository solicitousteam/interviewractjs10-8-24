import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Studentportal from "./studentportel/Studentportal";
import Home from "./Home/Home";
import Coustem from "./customain/Customain";
import Hero from "./Herosec/Hero";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Hero" element={<Hero />} />
        <Route path="/Studentportal" element={<Studentportal />} />
        <Route path="/Coustem" element={<Coustem />} />
      </Routes>
    </Router>
  );
}

export default App;
