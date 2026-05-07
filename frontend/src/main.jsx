import React from "react";

import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import App from "./App";

import {
  AuthProvider
} from "./shared/context/AuthContext";

import {
  AIOperatorProvider
} from "./shared/context/AIOperatorContext";

import "./index.css";


const root = ReactDOM.createRoot(
  document.getElementById("root")
);


root.render(

  <React.StrictMode>

    <BrowserRouter>

      <AuthProvider>

        <AIOperatorProvider>

          <App />

        </AIOperatorProvider>

      </AuthProvider>

    </BrowserRouter>

  </React.StrictMode>
);