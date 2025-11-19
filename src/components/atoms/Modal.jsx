import React from "react";
import PropTypes from "prop-types";

export const Modal = ({
  isOpen,
  onClose,
  className = "",
  backdropClassName = "",
  children,
  ariaLabelledby,
  ariaDescribedby,
  closeOnBackdrop = true,
  closeOnEsc = true,
  maxWidthClass = "max-w-md",
}) => {
  const modalRef = React.useRef(null);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && closeOnEsc) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "animate-in fade-in duration-200",
        backdropClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget && closeOnBackdrop) {
          onClose?.();
        }
      }}
    >
      <div
        ref={modalRef}
        className={[
          "relative bg-white rounded-lg shadow-xl",
          "animate-in zoom-in-95 duration-200",
          `${maxWidthClass} w-full max-h-[90vh] overflow-auto`,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  className: PropTypes.string,
  backdropClassName: PropTypes.string,
  lockScroll: PropTypes.bool,
  children: PropTypes.node.isRequired,
  ariaLabelledby: PropTypes.string,
  ariaDescribedby: PropTypes.string,
  closeOnBackdrop: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  maxWidthClass: PropTypes.string,
};

export default Modal;
