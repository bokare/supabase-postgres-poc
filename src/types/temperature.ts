export interface TemperatureEvent {
  checkup_id: string;
  timestamp: string;
  temperature: number;
  status: 'normal' | 'critical';
  simulation_id: string;
  created_at: string;
}

export interface TemperatureChartData {
  time: string;
  timestamp: number;
  temperature: number;
  status: 'normal' | 'critical';
  simulation_id: string;
}

export interface TemperatureStats {
  current: number;
  average: number;
  min: number;
  max: number;
  critical_count: number;
  normal_count: number;
  last_updated: string;
}
