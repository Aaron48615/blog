import { useEffect, useRef } from "react";

function LoginBG() {
    const canvasRef = useRef(null)
    useEffect(() => {
        // 取到canvas画布
        const canvas = canvasRef.current;
        if (!canvas) return;
        // canvas环境
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = 0;
        let h = 0;
        let stars = [];

        // 窗口变化时重新计算
        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            // 绘制星星
            stars = []
            initStar();
        }

        const initStar = () => {
            const count = Math.random() * 200 + 300;
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.4 + 0.4,
                    speed: Math.random() * 0.3 + 0.1,
                    deviation: Math.random() * Math.PI * 2
                })
            }
        }
        // console.log(stars)
        const draw = (time) => {
            ctx.clearRect(0, 0, w, h)
            const bgColor = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.5, h * 0.5, w * 1.4);
            bgColor.addColorStop(0, '#000000')
            bgColor.addColorStop(0.5, '#230949')
            bgColor.addColorStop(1, '#1c0a38')
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, w, h);

            for (const s of stars) {
                const flicker = (Math.sin(
                    time / 1000 * Math.PI * 2 * s.speed + s.deviation
                ) + 1) / 2;

                // const alpha = Math.min(1, Math.max(0.2, flicker));
                const alpha = 0.1 + flicker * 0.9;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alpha})`
                ctx.fill();
            }

            requestAnimationFrame(draw)
        }

        resize();
        window.addEventListener('resize', resize)

        const raf = requestAnimationFrame(draw)

        return () => {
            cancelAnimationFrame(raf)
        }
    }, [])

    return (
        <div>
            <canvas ref={canvasRef} style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}>

            </canvas>
        </div>
    )
}

export default LoginBG;