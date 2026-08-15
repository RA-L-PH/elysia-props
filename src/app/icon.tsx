import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#D4AF37",
          borderRadius: "50%",
          border: "1.5px solid #D4AF37",
          fontWeight: "bold",
          fontFamily: "Georgia, serif",
          lineHeight: 1,
        }}
      >
        E
      </div>
    ),
    {
      ...size,
    }
  );
}
