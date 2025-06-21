"use client";

import React, { useState } from "react";
import AutoBattler from "@/components/AutoBattler";
import EnlistScene from "@/components/EnlistScene";

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
      <EnlistScene></EnlistScene>
    </div>
  );
};

export default Home;
