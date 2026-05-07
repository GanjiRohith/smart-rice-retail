import { Outlet, Link, useLocation } from "react-router-dom";

import { useAuth } from "../../../shared/hooks/useAuth";

import { useState } from "react";

import AIToggle from "../../../shared/components/AIToggle";

import AICommandBar from "../../../shared/components/AICommandBar";


const RiceIcon = () => (

  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
  >

    <ellipse
      cx="14"
      cy="14"
      rx="5"
      ry="10"
      fill="#2D6A4F"
      transform="rotate(-30 14 14)"
    />

    <ellipse
      cx="14"
      cy="14"
      rx="5"
      ry="10"
      fill="#52B788"
      opacity="0.6"
      transform="rotate(30 14 14)"
    />

  </svg>
);


export default function CustomerLayout() {

  const { user, logout } =
    useAuth();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const location =
    useLocation();


  const cartItems = JSON.parse(

    localStorage.getItem(
      "rice_cart"
    ) || "[]"
  );


  const cartCount =
    cartItems.reduce(

      (sum, i) => sum + i.quantity,

      0
    );


  const navLinks = [

    {
      to: "/customer",
      label: "Home"
    },

    {
      to: "/customer/orders",
      label: "My Orders"
    },

    {
      to: "/customer/chatbot",
      label: "AI Assistant"
    },

    {
      to: "/customer/profile",
      label: "Profile"
    }
  ];


  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">

            {/* LOGO */}

            <Link
              to="/customer"
              className="flex items-center gap-2"
            >

              <RiceIcon />

              <div>

                <span className="text-xl font-bold text-green-800">
                  Rice
                </span>

                <span className="text-xl font-bold text-amber-700">
                  Retail
                </span>

              </div>

            </Link>


            {/* DESKTOP NAV */}

            <nav className="hidden md:flex items-center gap-6">

              {navLinks.map((l) => (

                <Link
                  key={l.to}
                  to={l.to}

                  className={`text-sm font-medium transition-colors ${
                    location.pathname === l.to
                      ? "text-green-700 border-b-2 border-green-700 pb-0.5"
                      : "text-gray-600 hover:text-green-700"
                  }`}
                >

                  {l.label}

                </Link>
              ))}

            </nav>


            {/* RIGHT SIDE */}

            <div className="flex items-center gap-3">

              {/* AI TOGGLE */}

              <AIToggle />


              {/* CART */}

              <Link
                to="/customer/cart"
                aria-label="Cart"

                className="relative p-2 text-gray-600 hover:text-green-700"
              >

                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}

                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />

                </svg>

                {cartCount > 0 && (

                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">

                    {cartCount}

                  </span>
                )}

              </Link>


              {/* USER */}

              <span className="hidden sm:inline text-sm text-gray-600">

                Hi, {user?.name?.split(" ")[0] || "User"}

              </span>


              {/* LOGOUT */}

              <button
                onClick={logout}

                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >

                Logout

              </button>


              {/* MOBILE MENU BUTTON */}

              <button
                onClick={() =>
                  setMenuOpen(!menuOpen)
                }

                className="md:hidden p-2 text-gray-600"
              >

                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}

                    d={
                      menuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />

                </svg>

              </button>

            </div>

          </div>


          {/* MOBILE NAV */}

          {menuOpen && (

            <div className="md:hidden py-3 border-t border-gray-100">

              <div className="mb-3">

                <AIToggle />

              </div>

              {navLinks.map((l) => (

                <Link
                  key={l.to}
                  to={l.to}

                  onClick={() =>
                    setMenuOpen(false)
                  }

                  className="block py-2 text-sm text-gray-700 hover:text-green-700"
                >

                  {l.label}

                </Link>
              ))}

            </div>
          )}

        </div>

      </header>


      {/* ========================= */}
      {/* MAIN */}
      {/* ========================= */}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <Outlet />

      </main>


      {/* ========================= */}
      {/* AI COMMAND BAR */}
      {/* ========================= */}

      <AICommandBar />


      {/* ========================= */}
      {/* FOOTER */}
      {/* ========================= */}

      <footer className="bg-green-900 text-white mt-auto">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* BRAND */}

            <div>

              <div className="flex items-center gap-2 mb-3">

                <RiceIcon />

                <span className="text-xl font-bold text-white">
                  RiceRetail
                </span>

              </div>

              <p className="text-green-200 text-sm">

                Premium quality rice delivered to your door.
                Sourced directly from trusted farmers.

              </p>

            </div>


            {/* QUICK LINKS */}

            <div>

              <h4 className="font-semibold mb-3 text-green-100">

                Quick Links

              </h4>

              <div className="flex flex-col gap-2 text-green-300 text-sm">

                <Link
                  to="/customer"
                  className="hover:text-white transition-colors"
                >
                  Shop
                </Link>

                <Link
                  to="/customer/orders"
                  className="hover:text-white transition-colors"
                >
                  My Orders
                </Link>

                <Link
                  to="/customer/chatbot"
                  className="hover:text-white transition-colors"
                >
                  Support Chat
                </Link>

              </div>

            </div>


            {/* CONTACT */}

            <div>

              <h4 className="font-semibold mb-3 text-green-100">

                Contact

              </h4>

              <div className="text-green-300 text-sm space-y-1">

                <p>📞 1800-RICE-001</p>

                <p>✉️ support@riceretail.in</p>

                <p>📍 Hyderabad, Telangana</p>

              </div>

            </div>

          </div>


          {/* COPYRIGHT */}

          <div className="border-t border-green-800 mt-8 pt-6 text-center text-green-400 text-xs">

            © 2026 RiceRetail. All rights reserved.

          </div>

        </div>

      </footer>

    </div>
  );
}