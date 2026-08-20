import { useEffect } from "react";
import { useHeader } from "../../layout/LayoutContext";

const VendorDashboardPage = () => {
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({
      title: "Vendor Dashboard",
      subtitle: "Overview of your platform’s performance and activity",
      backTo: null,
    });
  }, [setHeaderConfig]);

  return (
    <div className="p-3">
      <h4>Welcome to your Dashboard</h4>
    </div>
  );
};

export default VendorDashboardPage;