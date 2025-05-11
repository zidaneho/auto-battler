"use client";

import React, { useState } from "react";
import ThreeScene from "@/components/ThreeScene";

const Home: React.FC = () => {
  const [color, setColor] = useState<number>(0x00ff00);

  const handlePickColor = () => {
    const newColor = Math.random() * 0xffffff;
    setColor(newColor);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* <ModelManager /> */}
      <ThreeScene />
    </div>
  );
};

export default Home;
