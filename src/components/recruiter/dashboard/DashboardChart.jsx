import { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, BarController, DoughnutController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, BarController, DoughnutController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const DashboardChart = ({ type, data, options, height = 220 }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    
    // Destroy existing chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    try {
      chartRef.current = new ChartJS(canvasRef.current, {
        type,
        data,
        options,
      });
    } catch (error) {
      console.error('Chart error:', error);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, data, options]);

  return <canvas ref={canvasRef} height={height} />;
};

export default DashboardChart;
