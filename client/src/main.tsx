import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerLicense } from '@syncfusion/ej2-base';

// Register your license key here if you need to use a licensed library
// const license = process.env.SYNCFUSION_LICENSE_KEY || '';
// registerLicense(license);

createRoot(document.getElementById("root")!).render(<App />);
