"use client";

import React, { useState } from "react";
import ThreeScene from "@/components/ThreeScene";
import { GameOverlay } from "@/components/GameOverlay";


export default function Home() {
  const [color, setColor] = useState(0x00ff00);

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
      <ThreeScene></ThreeScene>
    </div>
  );
}
