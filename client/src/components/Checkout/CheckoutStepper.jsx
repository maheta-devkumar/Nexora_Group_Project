import React from 'react';
import './CheckoutStepper.css';

const CheckoutStepper = ({ steps, currentStep }) => {
  // Calculate progress width percentage (0% for step 1, 50% for step 2, 100% for step 3)
  const progressWidth = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="checkout-stepper">
      <div className="stepper-container" style={{ '--progress-width': `${progressWidth}%` }}>
        {/* Dynamic Progress Line Overlay */}

        {steps.map((step) => (
          <div
            key={step.number}
            className={`stepper-step ${currentStep > step.number ? 'completed' : ''} ${currentStep === step.number ? 'active' : ''}`}
          > 
            <div className="step-number">
              {currentStep > step.number ? (
                <i className="fas fa-check"></i>
              ) : (
                step.number
              )}
            </div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckoutStepper;