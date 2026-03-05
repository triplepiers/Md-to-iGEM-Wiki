import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

type EChartProps = React.HTMLAttributes<HTMLDivElement> & {
  options?: string;
  'data-options'?: string;
  height?: string;
  width?: string;
  renderer?: 'canvas' | 'svg';
};

export const EChart: React.FC<EChartProps> = ({
  options,
  height,
  width,
  renderer,
  className,
  ...props
}) => {
  const dataOptions = (props as any)['data-options'] as string | undefined;
  const rawOptions = (dataOptions ?? options ?? '').trim();

  const { parsed, error } = useMemo(() => {
    if (!rawOptions) {
      return { parsed: null as any, error: 'Chart options are empty' };
    }
    try {
      return { parsed: JSON.parse(rawOptions), error: '' };
    } catch (err: any) {
      return { parsed: null as any, error: err?.message ?? 'Invalid chart options' };
    }
  }, [rawOptions]);

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        Warning: {error}
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      <ReactECharts
        option={parsed}
        style={{ width: width ?? '100%', height: height ?? '320px' }}
        opts={renderer ? { renderer } : undefined}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};
