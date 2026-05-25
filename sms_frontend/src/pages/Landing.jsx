import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Landing.css';

function Landing() {
  const isAuthenticated = !!localStorage.getItem('token');

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      <div className="landing-content">
        <Logo size={140} showText={true} textColor="#ffffff" className="landing-logo" />

        <p className="landing-description">
          Empowering educational institutions with a seamless, centralized platform. 
          Manage departments, streamline attendance, evaluate assignments, and connect students and faculty—all in one intuitive ecosystem.
        </p>

        <div className="landing-actions">
          <Link to="/login" className="btn btn-primary landing-btn">
            Get Started / Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Landing;
