"use client";

import { useEffect, useRef, useState } from "react";

interface LegoBattleAnimationProps {
  player1CharId: string;
  player2CharId: string;
  isPlaying: boolean;
  currentAttacker?: string;
  onHit?: () => void;
}

// LEGO Minifigure colors by character
const characterColors: Record<string, { body: string; head: string; accent: string; glow: string }> = {
  thanos: { body: "#6B21A8", head: "#A855F7", accent: "#FFD700", glow: "#A855F7" },
  thor: { body: "#1E40AF", head: "#FFE4B5", accent: "#FFD700", glow: "#60A5FA" },
  scarlet: { body: "#DC2626", head: "#FFE4B5", accent: "#FF0000", glow: "#EF4444" },
  ironman: { body: "#DC2626", head: "#FFD700", accent: "#FFD700", glow: "#F59E0B" },
  cap: { body: "#1E40AF", head: "#FFE4B5", accent: "#EF4444", glow: "#3B82F6" },
  hulk: { body: "#15803D", head: "#22C55E", accent: "#000000", glow: "#22C55E" },
  spiderman: { body: "#DC2626", head: "#DC2626", accent: "#1E40AF", glow: "#EF4444" },
  strange: { body: "#1E40AF", head: "#FFE4B5", accent: "#22C55E", glow: "#8B5CF6" },
  panther: { body: "#1F2937", head: "#1F2937", accent: "#A855F7", glow: "#8B5CF6" },
  marvel: { body: "#DC2626", head: "#FFE4B5", accent: "#FFD700", glow: "#F59E0B" },
  wolverine: { body: "#FCD34D", head: "#FFE4B5", accent: "#1F2937", glow: "#FBBF24" },
  deadpool: { body: "#DC2626", head: "#DC2626", accent: "#1F2937", glow: "#EF4444" },
  hawkeye: { body: "#4B0082", head: "#FFE4B5", accent: "#1F2937", glow: "#8B5CF6" },
  antman: { body: "#DC2626", head: "#FFE4B5", accent: "#1F2937", glow: "#EF4444" },
  falcon: { body: "#1F2937", head: "#8B4513", accent: "#DC2626", glow: "#EF4444" },
};

export function LegoBattleAnimation({
  player1CharId,
  player2CharId,
  isPlaying,
  currentAttacker,
  onHit,
}: LegoBattleAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);
  const animationRef = useRef<number>();

  const p1Colors = characterColors[player1CharId] || characterColors.spiderman;
  const p2Colors = characterColors[player2CharId] || characterColors.ironman;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const drawLegoMinifig = (
      x: number,
      y: number,
      colors: typeof p1Colors,
      flip: boolean,
      animation: { bob: number; armAngle: number; legAngle: number }
    ) => {
      ctx.save();
      ctx.translate(x, y + animation.bob);
      if (flip) ctx.scale(-1, 1);

      const scale = 0.8;
      ctx.scale(scale, scale);

      // Glow effect
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 15;

      // Legs
      ctx.fillStyle = colors.body;
      ctx.save();
      ctx.rotate(animation.legAngle);
      ctx.fillRect(-15, 30, 12, 25);
      ctx.restore();
      ctx.save();
      ctx.rotate(-animation.legAngle);
      ctx.fillRect(3, 30, 12, 25);
      ctx.restore();

      // Feet (LEGO style)
      ctx.fillStyle = "#1F2937";
      ctx.fillRect(-18, 52, 15, 8);
      ctx.fillRect(3, 52, 15, 8);

      // Body
      ctx.fillStyle = colors.body;
      ctx.beginPath();
      ctx.roundRect(-20, -5, 40, 40, 4);
      ctx.fill();

      // Body accent
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(0, 15, 8, 0, Math.PI * 2);
      ctx.fill();

      // Arms
      ctx.fillStyle = colors.body;
      // Left arm
      ctx.save();
      ctx.translate(-22, 5);
      ctx.rotate(-animation.armAngle);
      ctx.fillRect(-5, 0, 10, 25);
      // Hand
      ctx.fillStyle = "#FCD34D";
      ctx.beginPath();
      ctx.arc(0, 28, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Right arm (weapon arm)
      ctx.save();
      ctx.translate(22, 5);
      ctx.rotate(animation.armAngle * 1.5);
      ctx.fillStyle = colors.body;
      ctx.fillRect(-5, 0, 10, 25);
      // Hand
      ctx.fillStyle = "#FCD34D";
      ctx.beginPath();
      ctx.arc(0, 28, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Neck
      ctx.fillStyle = "#FCD34D";
      ctx.fillRect(-8, -12, 16, 10);

      // Head (LEGO cylindrical head)
      ctx.fillStyle = colors.head;
      ctx.beginPath();
      ctx.ellipse(0, -30, 22, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head top stud
      ctx.fillStyle = colors.head;
      ctx.beginPath();
      ctx.ellipse(0, -55, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face
      ctx.fillStyle = "#000";
      // Eyes
      ctx.beginPath();
      ctx.arc(-8, -32, 3, 0, Math.PI * 2);
      ctx.arc(8, -32, 3, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.beginPath();
      ctx.arc(0, -25, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.restore();
    };

    const drawBackground = () => {
      // Arena background
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(1, "#0a0a0f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Floor
      ctx.fillStyle = "#2a2a3e";
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 30, width / 2, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      // LEGO studs on floor
      ctx.fillStyle = "#3a3a4e";
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.beginPath();
          ctx.ellipse(80 + i * 50, height - 50 + j * 30, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawEffects = (attackerSide: "left" | "right" | null) => {
      if (!attackerSide) return;

      const time = frame * 0.1;
      const attackX = attackerSide === "left" ? width / 2 - 30 : width / 2 + 30;

      // Impact effect
      ctx.save();
      ctx.globalAlpha = 0.8;

      // Energy burst
      const burstColors = ["#FFD700", "#FF6B6B", "#4ECDC4"];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time;
        const radius = 20 + Math.sin(time * 3) * 10;
        ctx.fillStyle = burstColors[i % 3];
        ctx.beginPath();
        ctx.arc(
          attackX + Math.cos(angle) * radius,
          height / 2 + Math.sin(angle) * radius,
          5 + Math.sin(time * 5) * 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // POW text
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      const powY = height / 2 - 60 - Math.sin(time * 5) * 10;
      ctx.strokeText("POW!", width / 2, powY);
      ctx.fillText("POW!", width / 2, powY);

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      drawBackground();

      const time = frame * 0.05;
      const bob1 = Math.sin(time * 2) * 3;
      const bob2 = Math.sin(time * 2 + Math.PI) * 3;

      let arm1 = Math.sin(time) * 0.3;
      let arm2 = Math.sin(time + Math.PI) * 0.3;
      let leg1 = Math.sin(time * 1.5) * 0.2;
      let leg2 = Math.sin(time * 1.5 + Math.PI) * 0.2;

      let p1X = width * 0.25;
      let p2X = width * 0.75;

      // Attack animation
      if (currentAttacker === player1CharId) {
        p1X += Math.sin(time * 8) * 30;
        arm1 = -Math.PI / 3;
        drawEffects("left");
      } else if (currentAttacker === player2CharId) {
        p2X -= Math.sin(time * 8) * 30;
        arm2 = -Math.PI / 3;
        drawEffects("right");
      }

      // Draw characters
      drawLegoMinifig(p1X, height / 2 + 20, p1Colors, false, {
        bob: bob1,
        armAngle: arm1,
        legAngle: leg1,
      });

      drawLegoMinifig(p2X, height / 2 + 20, p2Colors, true, {
        bob: bob2,
        armAngle: arm2,
        legAngle: leg2,
      });

      // VS text
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.textAlign = "center";
      ctx.fillText("VS", width / 2, height / 2);

      setFrame((f) => f + 1);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    } else {
      // Static render
      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawLegoMinifig(width * 0.25, height / 2 + 20, p1Colors, false, {
        bob: 0,
        armAngle: 0,
        legAngle: 0,
      });
      drawLegoMinifig(width * 0.75, height / 2 + 20, p2Colors, true, {
        bob: 0,
        armAngle: 0,
        legAngle: 0,
      });
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentAttacker, frame, p1Colors, p2Colors, player1CharId, player2CharId]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      style={{
        width: "100%",
        maxWidth: 400,
        height: "auto",
        borderRadius: 16,
        background: "#0a0a0f",
      }}
    />
  );
}
