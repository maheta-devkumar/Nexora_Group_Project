import { toast, Slide } from "react-toastify";

export const toastSuccess = (message) =>
  toast.success(message, {
    position: "top-center",
    autoClose: 1800,
    transition: Slide,
    theme: "colored",
  });

export const toastError = (message) =>
  toast.error(message, {
    position: "top-center",
    autoClose: 2000,
    transition: Slide,
    theme: "colored",
  });

export const toastWarning = (message) =>
  toast.warning(message, {
    position: "top-center",
    autoClose: 2000,
    transition: Slide,
    theme: "colored",
  });

export const toastInfo = (message) =>
  toast.info(message, {
    position: "top-center",
    autoClose: 1800,
    transition: Slide,
    theme: "colored",
  });
