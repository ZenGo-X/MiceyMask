import React from 'react';
import PropTypes from 'prop-types';

const IconImpersonate = ({
  size = 24,
  color = 'currentColor',
  ariaLabel,
  className,
}) => (
  <svg
    width={size}
    height={size}
    fill={color}
    className={className}
    aria-label={ariaLabel}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="50 -100 512 680"
  >
    <path
      xmlns="http://www.w3.org/2000/svg"
      d="M320.67 64c-442.6 0-357.57 384-158.46 384 39.9 0 77.47-20.69 101.42-55.86l25.73-37.79c15.66-22.99 46.97-22.99 62.63 0l25.73 37.79C401.66 427.31 439.23 448 479.13 448c189.86 0 290.63-384-158.46-384zM184 308.36c-41.06 0-67.76-25.66-80.08-41.05-5.23-6.53-5.23-16.09 0-22.63 12.32-15.4 39.01-41.05 80.08-41.05s67.76 25.66 80.08 41.05c5.23 6.53 5.23 16.09 0 22.63-12.32 15.4-39.02 41.05-80.08 41.05zm272 0c-41.06 0-67.76-25.66-80.08-41.05-5.23-6.53-5.23-16.09 0-22.63 12.32-15.4 39.01-41.05 80.08-41.05s67.76 25.66 80.08 41.05c5.23 6.53 5.23 16.09 0 22.63-12.32 15.4-39.02 41.05-80.08 41.05z"
    />
  </svg>
);

IconImpersonate.propTypes = {
  /**
   * The size of the Icon follows an 8px grid 2 = 16px, 3 = 24px etc
   */
  size: PropTypes.number,
  /**
   * The color of the icon accepts design token css variables
   */
  color: PropTypes.string,
  /**
   * An additional className to assign the Icon
   */
  className: PropTypes.string,
  /**
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};

export default IconImpersonate;
