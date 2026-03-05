import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface PieDatum {
  name: string;
  value: number;
}

interface PieChartExampleProps {
  title?: string;
  height?: number | string;
  data?: PieDatum[];
}

const DEFAULT_DATA: PieDatum[] = [
  { name: 'Protein A', value: 42 },
  { name: 'Protein B', value: 28 },
  { name: 'Protein C', value: 18 },
  { name: 'Protein D', value: 12 },
];

export const PieChartExample: React.FC<PieChartExampleProps> = ({
  height = 360,
  data = DEFAULT_DATA,
}) => {
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'item',
      },
      legend: {
        bottom: 0,
        left: 'center',
      },
      series: [
        {
          name: 'Ratio',
          type: 'pie',
          radius: ['35%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            formatter: '{b}: {d}%',
          },
          emphasis: {
            label: {
              fontSize: 14,
              fontWeight: 700,
            },
          },
          data,
        },
      ],
    }),
    [data]
  );

  return <ReactECharts option={option} style={{ width: '100%', height }} />;
};

export default PieChartExample;
