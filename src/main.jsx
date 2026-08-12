import React from "react";
import { createRoot } from "react-dom/client";
import VolumetricCalculator from "./App.jsx";
import "./styles.css";
createRoot(document.getElementById("root")).render(<React.StrictMode><VolumetricCalculator /></React.StrictMode>);
