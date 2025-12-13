import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export const Home = () => {
  return (
    // Main Container: Ensures full height (minus navbar) and uses flex column
    <div className="main-container no-image-mode">
      
      {/* --- CONTENT LAYER (Full Width) --- */}
      <div className="content-layer">
        
        {/* RIGHT SIDE (Full Width Text Block) */}
        <div className="content-center-focus">
          
          

          {/* 2. Main Text Block (Vertically Centered) */}
          <div className="content-middle-block minimal">
            <h1 className="hero-title">
              Precision Medicine, <br />
              <span className="text-highlight">Simplified Access.</span>
            </h1>
            
            <p className="hero-description">
              Welcome to City Care Clinic. We focus on advanced diagnostics and personalized treatment, providing our patients with seamless booking and dedicated care.
            </p>

            <div className="action-group">
              <Link to="/login" className="btn-primary minimal">
                Book Appointment
              </Link>
              </div>
          </div>

          {/* 3. Bottom Stat Strip */}
          <div className="stat-strip minimal">
            <div className="stat-item">
              <h6>CLINIC HOURS</h6>
              <p>9:00 AM - 12:20 PM</p>
            </div>
            <div className="stat-item">
              <h6>EMERGENCY LINE</h6>
              <p>+91 1234567899</p>
            </div>
            <div className="stat-item">
              <h6>PLACE</h6>
              <p>Kothamangalam</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;