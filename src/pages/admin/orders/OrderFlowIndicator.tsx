// Pipeline sequence for standard happy-path
const FLOW_STEPS = [
  { key: "payment_pending", label: "Payment Pending", color: "#eab308" },
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "confirmed", label: "Confirmed", color: "#3b82f6" },
  { key: "processing", label: "Processing", color: "#8b5cf6" },
  { key: "packed", label: "Packed", color: "#6366f1" },
  { key: "shipped", label: "Shipped", color: "#06b6d4" },
  { key: "out_for_delivery", label: "Out for Delivery", color: "#0ea5e9" },
  { key: "delivered", label: "Delivered", color: "#10b981" },
];

export const OrderFlowIndicator = () => {
  return (
    <div className="ol-flow-card">
      <div className="ol-flow-header">
        <div className="ol-flow-title">
          <span>Order Lifecycle Flow</span>
          <span className="ol-flow-title-badge">Standard Pipeline</span>
        </div>
        <div className="ol-flow-branches">
          <span>Branch Rules:</span>
          <span className="ol-flow-branch-tag ol-flow-branch-tag--cancel">
            ✕ Can be Cancelled (Pending → Out for Delivery)
          </span>
          <span className="ol-flow-branch-tag ol-flow-branch-tag--return">
            ↺ Can be Returned (Only from Delivered)
          </span>
        </div>
      </div>

      <div className="ol-flow-steps-wrapper">
        <div className="ol-flow-steps">
          {FLOW_STEPS.map((step, idx) => {
            const isLast = idx === FLOW_STEPS.length - 1;
            return (
              <div className="ol-flow-step-item" key={step.key}>
                <div className="ol-flow-step-node">
                  <div
                    className="ol-flow-step-dot"
                    style={{ backgroundColor: step.color }}
                  >
                    {idx + 1}
                  </div>
                  <span className="ol-flow-step-label">{step.label}</span>
                </div>
                {!isLast && <div className="ol-flow-connector" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
