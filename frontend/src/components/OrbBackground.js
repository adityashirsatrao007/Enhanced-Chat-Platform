import React, { useRef, useEffect } from "react";

// Orb background from reactbits.dev
const OrbBackground = ({ style }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let orb = {
      x: width / 2,
      y: height / 2,
      r: Math.min(width, height) / 3,
      dx: 2,
      dy: 1.5,
      dr: 0.5,
      color: "#6366f1",
    };

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, 2 * Math.PI);
      ctx.fillStyle = orb.color;
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 80;
      ctx.fill();
      ctx.restore();
    }

    function animate() {
      orb.x += orb.dx;
      orb.y += orb.dy;
      orb.r += orb.dr;
      if (orb.x + orb.r > width || orb.x - orb.r < 0) orb.dx *= -1;
      if (orb.y + orb.r > height || orb.y - orb.r < 0) orb.dy *= -1;
      if (
        orb.r > Math.min(width, height) / 2 ||
        orb.r < Math.min(width, height) / 4
      )
        orb.dr *= -1;
      draw();
      requestAnimationFrame(animate);
    }

    animate();

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      orb.x = width / 2;
      orb.y = height / 2;
      orb.r = Math.min(width, height) / 3;
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};

export default OrbBackground;
