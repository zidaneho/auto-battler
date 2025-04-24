"use client";
import React from "react";

export const GameOverlay = ({ onPickColor }) => {
  return (
    <div
      className="absolute top-[20px] left-[20px] z-10 bg-white/80 px-3 py-2 rounded"
      onClick={onPickColor}
    >
      Pick a color
    </div>
  );
};
