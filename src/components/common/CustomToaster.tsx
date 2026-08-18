import { Toaster as SonnerToaster } from "sonner";
import "../../styles/Toaster.css";

export const CustomToaster = () => {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="light"
      closeButton
      richColors
      className="custom-toaster"
      duration={4000}
    />
  );
};
