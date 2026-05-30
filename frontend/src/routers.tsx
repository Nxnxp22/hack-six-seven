import { createHashRouter } from "react-router-dom";
import PowerOverloadPage from "./modules/powerOverload/PowerOverloadPage";

export const router = createHashRouter([
  {
    path: "/",
    element: <PowerOverloadPage />,
  },
]);
