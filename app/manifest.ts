import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MH Markets | Expo Prediction Challenge",
    short_name: "MH Markets",
    description: "Trade Prediction Challenge and Spin & Win, live at the MH Markets expo booth.",
    start_url: "/",
    display: "fullscreen",
    orientation: "landscape",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/media/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
