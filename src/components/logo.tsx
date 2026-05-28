import logo from "@/assets/hwm-logo.jpeg";

export function Logo({ className = "" }: { className?: string }) {
  return <img src={logo} alt="HWM Refrigeração" className={`rounded-md object-cover ${className}`} />;
}
