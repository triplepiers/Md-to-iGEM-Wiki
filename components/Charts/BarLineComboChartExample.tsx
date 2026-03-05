import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface BarLineComboChartExampleProps {
  title?: string;
  height?: number | string;
  categories?: string[];
  barData?: number[];
  lineData?: number[];
}

const DEFAULT_CATEGORIES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_BAR_DATA = [120, 200, 150, 80, 70, 110, 130];
const DEFAULT_LINE_DATA = [30, 45, 40, 25, 20, 35, 38];

export const BarLineComboChartExample: React.FC<BarLineComboChartExampleProps> = ({
  height = 360,
  categories = DEFAULT_CATEGORIES,
  barData = DEFAULT_BAR_DATA,
  lineData = DEFAULT_LINE_DATA,
}) => {
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        top: 30,
      },
      grid: {
        left: 48,
        right: 48,
        top: 80,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: categories,
      },
      yAxis: [
        {
          type: 'value',
          name: 'Yield',
          position: 'left',
        },
        {
          type: 'value',
          name: 'Rate (%)',
          position: 'right',
          min: 0,
          max: 100,
        },
      ],
      series: [
        {
          name: 'Yield',
          type: 'bar',
          yAxisIndex: 0,
          data: barData,
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [4, 4, 0, 0],
          },
          barMaxWidth: 36,
        },
        {
          name: 'Conversion Rate',
          type: 'line',
          yAxisIndex: 1,
          data: lineData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: {
            width: 3,
            color: '#ef4444',
          },
          itemStyle: {
            color: '#ef4444',
          },
        },
      ],
    }),
    [barData, categories, lineData]
  );

  return <ReactECharts option={option} style={{ width: '100%', height }} />;
};

export default BarLineComboChartExample;
