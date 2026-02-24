function jetColor(t) {
    const clamp = (x) => Math.max(0, Math.min(1, x));
    const r = clamp(1.5 - Math.abs(4 * t - 3));
    const g = clamp(1.5 - Math.abs(4 * t - 2));
    const b = clamp(1.5 - Math.abs(4 * t - 1));
    return `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
}

function getColorbar(barId, interval, axisPosition, axisVal){
    const canvas = document.getElementById(barId);
    const ctx = canvas.getContext("2d");
    const vmin = Math.min(...interval);
    const vmax = Math.max(...interval);

    const padding = {
        top: 20,
        bottom: 20,
    };

    const barWidth = 25;
    const barHeight = canvas.height - padding.top - padding.bottom;
    const barX = (canvas.width - barWidth) / 2; // 가운데 정렬
    const barY = padding.top;

    // scale
    const logMin = Math.log10(vmin);
    const logMax = Math.log10(vmax);

    function valueToT(v) {
        return (Math.log10(v) - logMin) / (logMax - logMin);
    }

    // vertical bar
    for (let y = 0; y < barHeight; y++) {
        const t = 1 - y / (barHeight - 1);
        ctx.fillStyle = jetColor(t);
        ctx.fillRect(barX, barY + y, barWidth, 1);
    }

    // border
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // text - tick, label
    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    interval.forEach((v) => {
        const t = valueToT(v);
        const y = barY + (1 - t) * barHeight;

        ctx.beginPath();
        ctx.moveTo(barX + barWidth, y);
        ctx.lineTo(barX + barWidth + 6, y);
        ctx.stroke();
        ctx.fillText(v.toString(), barX + barWidth + 8, y);
    });

    ctx.save();
    ctx.font = "14px sans-serif bold";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (axisPosition == "top") {
        ctx.fillText(axisVal, barX + barWidth + 8, barY - 15);
    } else if (axisPosition =="right") {
        ctx.translate(barX + barWidth + 50, canvas.height / 2);
        ctx.fillText(axisVal, 0, 0);
    }
    
    ctx.restore();
}